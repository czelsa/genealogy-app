# Offline Static Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Express/SQLite backend with a fully client-side, IndexedDB-backed data layer so the app runs as a single static site (GitHub Pages), installable as a PWA, with no server and no account/card requirement anywhere.

**Architecture:** Keep `client/` and all its existing UI components (`TreeView.vue`, `App.vue`, `layout.js`) almost untouched. Add a new `client/src/data/` module that exposes the exact same `api` shape the components already call, backed by IndexedDB (via the `idb` wrapper) instead of `fetch`. Delete `server/` once the client is fully self-sufficient.

**Tech Stack:** Vue 3 `<script setup>`, Vite, `idb` (IndexedDB wrapper), `fake-indexeddb` (test-only IndexedDB polyfill for jsdom), `read-gedcom` (already a dependency concept on the server side, now added to the client), Vitest, @vue/test-utils.

## Global Constraints

- This project has **no git safety net expectations beyond what's already pushed** - this plan DOES commit and push (the user explicitly asked for GitHub + Pages hosting), following the repo's existing commit style already used in this session (plain descriptive messages + `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` trailer). Push to `origin` using the `czelsa` `gh` account (`gh auth switch --user czelsa` before `git push`, `gh auth switch --user sara-czelusniak_with` after - this workspace's default account must stay active between unrelated work).
- No backend, no network calls anywhere in the app after this plan - everything persists in the browser's IndexedDB.
- Keep the exact same `api` method names/shapes already used by `App.vue`, `PersonForm.vue`, `FamilyEditor.vue` (`listPersons`, `getPerson`, `createPerson`, `updatePerson`, `deletePerson`, `listFamilies`, `getFamily`, `createFamily`, `updateFamily`, `addChild`, `getTree`) so those files need only an import-path change, not logic changes.
- `TreeView.vue` and `client/src/tree/layout.js` are NOT touched by this plan - they already work against the `{ persons, families }` graph shape this plan produces, and `TreeView.vue` already renders `maiden_name` when present.
- Only `image/jpeg` files are accepted for event photos (validated client-side now, there is no server to reject them).
- One photo per (`owner_type`, `owner_id`, `event_type`) - a new upload for the same triple replaces the previous one.
- `server/`, `Dockerfile`, `.dockerignore`, `render.yaml` are deleted once the client no longer needs them (Task 14) - don't delete them earlier, other tasks don't depend on their absence.
- Deployed URL target: `https://czelsa.github.io/genealogy-app/` - `vite.config.js`'s `base` must match this path exactly.

---

### Task 1: Dependencies and shared IndexedDB test harness

**Files:**
- Modify: `client/package.json`
- Modify: `client/vite.config.js`
- Create: `client/test-setup.js`

**Interfaces:**
- Produces: every client test now runs with a working `indexedDB` global (via `fake-indexeddb/auto`) and mocked `URL.createObjectURL`/`URL.revokeObjectURL`, so later tasks' tests don't need to set this up themselves.

- [ ] **Step 1: Edit `client/package.json`**

Add to `dependencies`:

```json
"idb": "^8.0.0"
```

Add to `devDependencies`:

```json
"fake-indexeddb": "^6.0.0"
```

- [ ] **Step 2: Install dependencies**

Run: `cd client && npm install`
Expected: no errors.

- [ ] **Step 3: Create `client/test-setup.js`**

```js
import 'fake-indexeddb/auto';

URL.createObjectURL = () => 'blob:mock-url';
URL.revokeObjectURL = () => {};
```

- [ ] **Step 4: Modify `client/vite.config.js`**

Add `setupFiles` to the existing `test` block:

```js
  test: {
    environment: 'jsdom',
    setupFiles: ['./test-setup.js'],
  },
```

(leave the `plugins` and `server.proxy` blocks exactly as they are)

- [ ] **Step 5: Verify the harness works**

Run: `cd client && npx vitest run`
Expected: PASS (all existing tests still pass - this step only adds new global setup, it changes no behavior yet).

- [ ] **Step 6: Commit**

```bash
cd /Users/sara.czelusniak/workspace/nauka/genealogy-app
git add client/package.json client/package-lock.json client/vite.config.js client/test-setup.js
git commit -m "chore: add idb + fake-indexeddb test harness for offline data layer"
```

(no push yet - push happens once per logical milestone, see Task 9)

---

### Task 2: IndexedDB schema (`db.js`)

**Files:**
- Create: `client/src/data/db.js`
- Create: `client/src/data/db.test.js`

**Interfaces:**
- Produces: `openGenealogyDb(dbName = 'genealogy')` returning a `Promise<IDBPDatabase>` with three object stores created: `persons`, `families`, `eventPhotos` (all `keyPath: 'id'`, `autoIncrement: true`). Used by every repo in Tasks 3-6.

- [ ] **Step 1: Write the failing test**

Create `client/src/data/db.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { openGenealogyDb } from './db.js';

describe('openGenealogyDb', () => {
  it('creates the three object stores', async () => {
    const db = await openGenealogyDb('test-db-1');
    expect(Array.from(db.objectStoreNames).sort()).toEqual(['eventPhotos', 'families', 'persons']);
    db.close();
  });

  it('autoincrements ids', async () => {
    const db = await openGenealogyDb('test-db-2');
    const id1 = await db.add('persons', { first_name: 'A' });
    const id2 = await db.add('persons', { first_name: 'B' });
    expect(id2).toBe(id1 + 1);
    db.close();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run src/data/db.test.js`
Expected: FAIL - `./db.js` does not exist.

- [ ] **Step 3: Create `client/src/data/db.js`**

```js
import { openDB } from 'idb';

export function openGenealogyDb(dbName = 'genealogy') {
  return openDB(dbName, 1, {
    upgrade(db) {
      db.createObjectStore('persons', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('families', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('eventPhotos', { keyPath: 'id', autoIncrement: true });
    },
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/sara.czelusniak/workspace/nauka/genealogy-app
git add client/src/data/db.js client/src/data/db.test.js
git commit -m "feat: add IndexedDB schema for offline data layer"
```

---

### Task 3: `personRepo`

**Files:**
- Create: `client/src/data/personRepo.js`
- Create: `client/src/data/personRepo.test.js`

**Interfaces:**
- Consumes: an `IDBPDatabase` from `openGenealogyDb` (Task 2).
- Produces: `createPersonRepo(db)` returning `{ list(), get(id), create(data), update(id, data), remove(id) }`, all async. `data`/returned objects carry `first_name, last_name, maiden_name, sex, birth_date, birth_place, death_date, death_place, notes`.

- [ ] **Step 1: Write the failing test**

Create `client/src/data/personRepo.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { openGenealogyDb } from './db.js';
import { createPersonRepo } from './personRepo.js';

describe('personRepo', () => {
  let repo;

  beforeEach(async () => {
    const db = await openGenealogyDb(`person-repo-${Math.random()}`);
    repo = createPersonRepo(db);
  });

  it('creates and fetches a person with maiden_name', async () => {
    const created = await repo.create({ first_name: 'Anna', last_name: 'Kowalska', maiden_name: 'Nowak', sex: 'F' });
    expect(created.id).toBeTypeOf('number');
    expect(created.maiden_name).toBe('Nowak');

    const fetched = await repo.get(created.id);
    expect(fetched.first_name).toBe('Anna');
  });

  it('defaults sex to U for invalid values', async () => {
    const created = await repo.create({ first_name: 'X', sex: 'invalid' });
    expect(created.sex).toBe('U');
  });

  it('updates a person', async () => {
    const created = await repo.create({ first_name: 'Jan' });
    const updated = await repo.update(created.id, { first_name: 'Janek', last_name: 'Kowalski' });
    expect(updated.first_name).toBe('Janek');
  });

  it('deletes a person', async () => {
    const created = await repo.create({ first_name: 'Ewa' });
    await repo.remove(created.id);
    expect(await repo.get(created.id)).toBeUndefined();
  });

  it('lists all persons', async () => {
    await repo.create({ first_name: 'A' });
    await repo.create({ first_name: 'B' });
    expect(await repo.list()).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run src/data/personRepo.test.js`
Expected: FAIL - `./personRepo.js` does not exist.

- [ ] **Step 3: Create `client/src/data/personRepo.js`**

```js
function normalize(data) {
  return {
    first_name: data.first_name ?? null,
    last_name: data.last_name ?? null,
    maiden_name: data.maiden_name ?? null,
    sex: ['M', 'F'].includes(data.sex) ? data.sex : 'U',
    birth_date: data.birth_date ?? null,
    birth_place: data.birth_place ?? null,
    death_date: data.death_date ?? null,
    death_place: data.death_place ?? null,
    notes: data.notes ?? null,
  };
}

export function createPersonRepo(db) {
  return {
    list() {
      return db.getAll('persons');
    },
    get(id) {
      return db.get('persons', id);
    },
    async create(data) {
      const id = await db.add('persons', normalize(data));
      return db.get('persons', id);
    },
    async update(id, data) {
      await db.put('persons', { ...normalize(data), id });
      return db.get('persons', id);
    },
    async remove(id) {
      await db.delete('persons', id);
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/sara.czelusniak/workspace/nauka/genealogy-app
git add client/src/data/personRepo.js client/src/data/personRepo.test.js
git commit -m "feat: add local personRepo (IndexedDB)"
```

---

### Task 4: `familyRepo`

**Files:**
- Create: `client/src/data/familyRepo.js`
- Create: `client/src/data/familyRepo.test.js`

**Interfaces:**
- Consumes: an `IDBPDatabase` (Task 2).
- Produces: `createFamilyRepo(db)` returning `{ list(), get(id), create(data), update(id, data), remove(id), addChild(familyId, childId, pedigree), removeChild(familyId, childId) }`. Family records always carry a `children: [{ child_id, pedigree }]` array. Used by Task 8's facade and Task 7's GEDCOM import.

- [ ] **Step 1: Write the failing test**

Create `client/src/data/familyRepo.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { openGenealogyDb } from './db.js';
import { createFamilyRepo } from './familyRepo.js';

describe('familyRepo', () => {
  let repo;

  beforeEach(async () => {
    const db = await openGenealogyDb(`family-repo-${Math.random()}`);
    repo = createFamilyRepo(db);
  });

  it('creates a family with an empty children array', async () => {
    const created = await repo.create({ husband_id: 1, wife_id: 2, marriage_date: '1 JAN 1980' });
    expect(created.husband_id).toBe(1);
    expect(created.children).toEqual([]);
  });

  it('adds a child to a family', async () => {
    const family = await repo.create({ husband_id: 1 });
    const updated = await repo.addChild(family.id, 42, 'birth');
    expect(updated.children).toEqual([{ child_id: 42, pedigree: 'birth' }]);
  });

  it('replaces the pedigree when adding the same child twice', async () => {
    const family = await repo.create({ husband_id: 1 });
    await repo.addChild(family.id, 42, 'birth');
    const updated = await repo.addChild(family.id, 42, 'adopted');
    expect(updated.children).toEqual([{ child_id: 42, pedigree: 'adopted' }]);
  });

  it('removes a child from a family', async () => {
    const family = await repo.create({ husband_id: 1 });
    await repo.addChild(family.id, 42, 'birth');
    const updated = await repo.removeChild(family.id, 42);
    expect(updated.children).toEqual([]);
  });

  it('updates family fields without losing children', async () => {
    const family = await repo.create({ husband_id: 1 });
    await repo.addChild(family.id, 42, 'birth');
    const updated = await repo.update(family.id, { husband_id: 1, marriage_date: '2 FEB 1981' });
    expect(updated.marriage_date).toBe('2 FEB 1981');
    expect(updated.children).toEqual([{ child_id: 42, pedigree: 'birth' }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run src/data/familyRepo.test.js`
Expected: FAIL - `./familyRepo.js` does not exist.

- [ ] **Step 3: Create `client/src/data/familyRepo.js`**

```js
function normalize(data) {
  return {
    husband_id: data.husband_id ?? null,
    wife_id: data.wife_id ?? null,
    marriage_date: data.marriage_date ?? null,
    marriage_place: data.marriage_place ?? null,
    divorce_date: data.divorce_date ?? null,
  };
}

export function createFamilyRepo(db) {
  return {
    list() {
      return db.getAll('families');
    },
    get(id) {
      return db.get('families', id);
    },
    async create(data) {
      const id = await db.add('families', { ...normalize(data), children: [] });
      return db.get('families', id);
    },
    async update(id, data) {
      const existing = await db.get('families', id);
      await db.put('families', { ...existing, ...normalize(data), id });
      return db.get('families', id);
    },
    async remove(id) {
      await db.delete('families', id);
    },
    async addChild(familyId, childId, pedigree = 'birth') {
      const family = await db.get('families', familyId);
      const children = family.children.filter((child) => child.child_id !== childId);
      children.push({ child_id: childId, pedigree });
      await db.put('families', { ...family, children });
      return db.get('families', familyId);
    },
    async removeChild(familyId, childId) {
      const family = await db.get('families', familyId);
      const children = family.children.filter((child) => child.child_id !== childId);
      await db.put('families', { ...family, children });
      return db.get('families', familyId);
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/sara.czelusniak/workspace/nauka/genealogy-app
git add client/src/data/familyRepo.js client/src/data/familyRepo.test.js
git commit -m "feat: add local familyRepo (IndexedDB)"
```

---

### Task 5: `treeRepo`

**Files:**
- Create: `client/src/data/treeRepo.js`
- Create: `client/src/data/treeRepo.test.js`

**Interfaces:**
- Consumes: an `IDBPDatabase` (Task 2).
- Produces: `createTreeRepo(db)` returning `{ getGraph() }` where `getGraph()` resolves `{ persons, families }` - the exact shape `TreeView.vue`/`layout.js` already expect.

- [ ] **Step 1: Write the failing test**

Create `client/src/data/treeRepo.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { openGenealogyDb } from './db.js';
import { createPersonRepo } from './personRepo.js';
import { createFamilyRepo } from './familyRepo.js';
import { createTreeRepo } from './treeRepo.js';

describe('treeRepo', () => {
  it('returns all persons and families', async () => {
    const db = await openGenealogyDb(`tree-repo-${Math.random()}`);
    const persons = createPersonRepo(db);
    const families = createFamilyRepo(db);
    const tree = createTreeRepo(db);

    const husband = await persons.create({ first_name: 'Jan' });
    const wife = await persons.create({ first_name: 'Anna' });
    const child = await persons.create({ first_name: 'Piotr' });
    const family = await families.create({ husband_id: husband.id, wife_id: wife.id });
    await families.addChild(family.id, child.id);

    const graph = await tree.getGraph();

    expect(graph.persons).toHaveLength(3);
    expect(graph.families).toHaveLength(1);
    expect(graph.families[0].children).toEqual([{ child_id: child.id, pedigree: 'birth' }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run src/data/treeRepo.test.js`
Expected: FAIL - `./treeRepo.js` does not exist.

- [ ] **Step 3: Create `client/src/data/treeRepo.js`**

```js
export function createTreeRepo(db) {
  return {
    async getGraph() {
      const persons = await db.getAll('persons');
      const families = await db.getAll('families');
      return { persons, families };
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/sara.czelusniak/workspace/nauka/genealogy-app
git add client/src/data/treeRepo.js client/src/data/treeRepo.test.js
git commit -m "feat: add local treeRepo (IndexedDB)"
```

---

### Task 6: `eventPhotoRepo`

**Files:**
- Create: `client/src/data/eventPhotoRepo.js`
- Create: `client/src/data/eventPhotoRepo.test.js`

**Interfaces:**
- Consumes: an `IDBPDatabase` (Task 2), the `URL.createObjectURL` mock from Task 1's `test-setup.js`.
- Produces: `createEventPhotoRepo(db)` returning `{ listByOwner(ownerType, ownerId), upsert({owner_type, owner_id, event_type, blob, original_name}), remove(id) }`. `listByOwner` results include a `url` field (`URL.createObjectURL(blob)`) for direct use in an `<img src>`.

- [ ] **Step 1: Write the failing test**

Create `client/src/data/eventPhotoRepo.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { openGenealogyDb } from './db.js';
import { createEventPhotoRepo } from './eventPhotoRepo.js';

describe('eventPhotoRepo', () => {
  it('upserts a photo and lists it by owner with a url', async () => {
    const db = await openGenealogyDb(`event-photo-repo-${Math.random()}`);
    const repo = createEventPhotoRepo(db);
    const blob = new Blob(['fake-jpeg-bytes'], { type: 'image/jpeg' });

    await repo.upsert({ owner_type: 'person', owner_id: 1, event_type: 'birth', blob, original_name: 'a.jpg' });
    const photos = await repo.listByOwner('person', 1);

    expect(photos).toHaveLength(1);
    expect(photos[0].event_type).toBe('birth');
    expect(photos[0].url).toBe('blob:mock-url');
  });

  it('upsert replaces the existing photo for the same owner+event', async () => {
    const db = await openGenealogyDb(`event-photo-repo-${Math.random()}`);
    const repo = createEventPhotoRepo(db);
    const first = new Blob(['first'], { type: 'image/jpeg' });
    const second = new Blob(['second'], { type: 'image/jpeg' });

    const firstPhoto = await repo.upsert({ owner_type: 'person', owner_id: 1, event_type: 'death', blob: first, original_name: 'a.jpg' });
    const secondPhoto = await repo.upsert({ owner_type: 'person', owner_id: 1, event_type: 'death', blob: second, original_name: 'b.jpg' });

    expect(secondPhoto.id).toBe(firstPhoto.id);
    expect(await repo.listByOwner('person', 1)).toHaveLength(1);
  });

  it('removes a photo', async () => {
    const db = await openGenealogyDb(`event-photo-repo-${Math.random()}`);
    const repo = createEventPhotoRepo(db);
    const blob = new Blob(['x'], { type: 'image/jpeg' });
    const photo = await repo.upsert({ owner_type: 'person', owner_id: 1, event_type: 'birth', blob, original_name: 'x.jpg' });

    await repo.remove(photo.id);

    expect(await repo.listByOwner('person', 1)).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run src/data/eventPhotoRepo.test.js`
Expected: FAIL - `./eventPhotoRepo.js` does not exist.

- [ ] **Step 3: Create `client/src/data/eventPhotoRepo.js`**

```js
export function createEventPhotoRepo(db) {
  return {
    async listByOwner(ownerType, ownerId) {
      const all = await db.getAll('eventPhotos');
      return all
        .filter((photo) => photo.owner_type === ownerType && photo.owner_id === ownerId)
        .map((photo) => ({ ...photo, url: URL.createObjectURL(photo.blob) }));
    },
    async upsert({ owner_type, owner_id, event_type, blob, original_name }) {
      const all = await db.getAll('eventPhotos');
      const existing = all.find(
        (photo) => photo.owner_type === owner_type && photo.owner_id === owner_id && photo.event_type === event_type
      );
      if (existing) {
        await db.put('eventPhotos', { ...existing, blob, original_name });
        return db.get('eventPhotos', existing.id);
      }
      const id = await db.add('eventPhotos', { owner_type, owner_id, event_type, blob, original_name });
      return db.get('eventPhotos', id);
    },
    async remove(id) {
      await db.delete('eventPhotos', id);
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/sara.czelusniak/workspace/nauka/genealogy-app
git add client/src/data/eventPhotoRepo.js client/src/data/eventPhotoRepo.test.js
git commit -m "feat: add local eventPhotoRepo (IndexedDB)"
```

---

### Task 7: `gedcomRepo` (import, export, download)

**Files:**
- Create: `client/src/data/gedcomRepo.js`
- Create: `client/src/data/gedcomRepo.test.js`

**Interfaces:**
- Consumes: `createPersonRepo`/`createFamilyRepo` instances (Tasks 3-4), `read-gedcom`.
- Produces: `parseGedcomBuffer(arrayBuffer)` (pure, pointer-id based), `importGedcomIntoRepos(personRepo, familyRepo, arrayBuffer)` returning `{ personCount, familyCount }`, `exportGedcom(graph)` returning GEDCOM text, `downloadGedcomFile(text, filename?)` (browser-only side effect: triggers a file download).

- [ ] **Step 1: Add the `read-gedcom` dependency**

Edit `client/package.json`, add to `dependencies`:

```json
"read-gedcom": "^0.3.2"
```

Run: `cd client && npm install`

- [ ] **Step 2: Write the failing test**

Create `client/src/data/gedcomRepo.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { openGenealogyDb } from './db.js';
import { createPersonRepo } from './personRepo.js';
import { createFamilyRepo } from './familyRepo.js';
import { parseGedcomBuffer, importGedcomIntoRepos, exportGedcom } from './gedcomRepo.js';

const SAMPLE_GEDCOM = `0 HEAD
1 SOUR test
1 GEDC
2 VERS 5.5.1
2 FORM LINEAGE-LINKED
1 CHAR UTF-8
0 @I1@ INDI
1 NAME Jan /Kowalski/
1 SEX M
1 BIRT
2 DATE 1 JAN 1950
2 PLAC Warszawa
0 @I2@ INDI
1 NAME Anna /Nowak/
1 SEX F
1 BIRT
2 DATE 5 MAY 1952
0 @I3@ INDI
1 NAME Piotr /Kowalski/
1 SEX M
1 BIRT
2 DATE 10 OCT 1975
0 @F1@ FAM
1 HUSB @I1@
1 WIFE @I2@
1 CHIL @I3@
1 MARR
2 DATE 1 JUN 1974
0 TRLR
`;

function sampleArrayBuffer() {
  return new TextEncoder().encode(SAMPLE_GEDCOM).buffer;
}

describe('parseGedcomBuffer', () => {
  it('parses individuals and families', () => {
    const { persons, families } = parseGedcomBuffer(sampleArrayBuffer());

    expect(persons).toHaveLength(3);
    const jan = persons.find((p) => p.first_name === 'Jan');
    expect(jan.last_name).toBe('Kowalski');
    expect(jan.sex).toBe('M');
    expect(jan.birth_date).toBe('1 JAN 1950');
    expect(jan.birth_place).toBe('Warszawa');

    expect(families).toHaveLength(1);
    expect(families[0].childPointerIds).toEqual(['@I3@']);
    expect(families[0].marriage_date).toBe('1 JUN 1974');
  });
});

describe('importGedcomIntoRepos', () => {
  it('inserts persons and families, linking children', async () => {
    const db = await openGenealogyDb(`gedcom-import-${Math.random()}`);
    const personRepo = createPersonRepo(db);
    const familyRepo = createFamilyRepo(db);

    const result = await importGedcomIntoRepos(personRepo, familyRepo, sampleArrayBuffer());

    expect(result).toEqual({ personCount: 3, familyCount: 1 });
    expect(await personRepo.list()).toHaveLength(3);
    const families = await familyRepo.list();
    expect(families).toHaveLength(1);
    expect(families[0].children).toHaveLength(1);
  });
});

describe('exportGedcom', () => {
  it('writes individuals and families as GEDCOM lines', () => {
    const graph = {
      persons: [
        { id: 1, first_name: 'Jan', last_name: 'Kowalski', sex: 'M', birth_date: '1 JAN 1950', birth_place: 'Warszawa', death_date: null, death_place: null, notes: null },
        { id: 2, first_name: 'Anna', last_name: 'Nowak', sex: 'F', birth_date: null, birth_place: null, death_date: null, death_place: null, notes: null },
      ],
      families: [
        { id: 1, husband_id: 1, wife_id: 2, marriage_date: '1 JUN 1974', marriage_place: null, divorce_date: null, children: [] },
      ],
    };

    const text = exportGedcom(graph);

    expect(text).toContain('0 HEAD');
    expect(text).toContain('0 @I1@ INDI');
    expect(text).toContain('1 NAME Jan /Kowalski/');
    expect(text).toContain('0 @F1@ FAM');
    expect(text).toContain('0 TRLR');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd client && npx vitest run src/data/gedcomRepo.test.js`
Expected: FAIL - `./gedcomRepo.js` does not exist.

- [ ] **Step 4: Create `client/src/data/gedcomRepo.js`**

```js
import { readGedcom } from 'read-gedcom';

function firstValue(selection) {
  const values = selection.value();
  return values.length > 0 ? values[0] : null;
}

function firstPointer(selection) {
  const pointers = selection.pointer();
  return pointers.length > 0 ? pointers[0] : null;
}

function normalizeSex(rawSex) {
  return rawSex === 'M' || rawSex === 'F' ? rawSex : 'U';
}

export function parseGedcomBuffer(arrayBuffer) {
  const gedcom = readGedcom(arrayBuffer);

  const persons = gedcom.getIndividualRecord().arraySelect().map((individual) => {
    const birth = individual.getEventBirth();
    const death = individual.getEventDeath();
    const nameParts = individual.getName().valueAsParts();
    const [given, surname] = nameParts.length > 0 ? nameParts[0] ?? [] : [];
    return {
      pointerId: firstPointer(individual),
      first_name: given ?? null,
      last_name: surname ?? null,
      sex: normalizeSex(firstValue(individual.getSex())),
      birth_date: firstValue(birth.getDate()),
      birth_place: firstValue(birth.getPlace()),
      death_date: firstValue(death.getDate()),
      death_place: firstValue(death.getPlace()),
      notes: individual.getNote().value().filter(Boolean).join('\n') || null,
    };
  });

  const families = gedcom.getFamilyRecord().arraySelect().map((family) => {
    const marriage = family.getEventMarriage();
    const divorce = family.getEventDivorce();
    return {
      husbandPointerId: firstValue(family.getHusband()),
      wifePointerId: firstValue(family.getWife()),
      marriage_date: firstValue(marriage.getDate()),
      marriage_place: firstValue(marriage.getPlace()),
      divorce_date: firstValue(divorce.getDate()),
      childPointerIds: family.getChild().value().filter(Boolean),
    };
  });

  return { persons, families };
}

export async function importGedcomIntoRepos(personRepo, familyRepo, arrayBuffer) {
  const { persons, families } = parseGedcomBuffer(arrayBuffer);

  const idByPointer = new Map();
  for (const person of persons) {
    const created = await personRepo.create(person);
    idByPointer.set(person.pointerId, created.id);
  }
  for (const family of families) {
    const created = await familyRepo.create({
      husband_id: idByPointer.get(family.husbandPointerId) ?? null,
      wife_id: idByPointer.get(family.wifePointerId) ?? null,
      marriage_date: family.marriage_date,
      marriage_place: family.marriage_place,
      divorce_date: family.divorce_date,
    });
    for (const childPointer of family.childPointerIds) {
      const childId = idByPointer.get(childPointer);
      if (childId != null) await familyRepo.addChild(created.id, childId, 'birth');
    }
  }

  return { personCount: persons.length, familyCount: families.length };
}

function escapeLine(value) {
  return String(value).replace(/[\r\n]+/g, ' ');
}

function formatIndividual(person, pointerFor) {
  const lines = [`0 ${pointerFor.person(person.id)} INDI`];
  lines.push(`1 NAME ${escapeLine(`${person.first_name ?? ''} /${person.last_name ?? ''}/`)}`);
  lines.push(`1 SEX ${person.sex ?? 'U'}`);
  if (person.birth_date || person.birth_place) {
    lines.push('1 BIRT');
    if (person.birth_date) lines.push(`2 DATE ${escapeLine(person.birth_date)}`);
    if (person.birth_place) lines.push(`2 PLAC ${escapeLine(person.birth_place)}`);
  }
  if (person.death_date || person.death_place) {
    lines.push('1 DEAT');
    if (person.death_date) lines.push(`2 DATE ${escapeLine(person.death_date)}`);
    if (person.death_place) lines.push(`2 PLAC ${escapeLine(person.death_place)}`);
  }
  if (person.notes) lines.push(`1 NOTE ${escapeLine(person.notes)}`);
  return lines;
}

function formatFamily(family, pointerFor) {
  const lines = [`0 ${pointerFor.family(family.id)} FAM`];
  if (family.husband_id) lines.push(`1 HUSB ${pointerFor.person(family.husband_id)}`);
  if (family.wife_id) lines.push(`1 WIFE ${pointerFor.person(family.wife_id)}`);
  for (const child of family.children) {
    lines.push(`1 CHIL ${pointerFor.person(child.child_id)}`);
  }
  if (family.marriage_date || family.marriage_place) {
    lines.push('1 MARR');
    if (family.marriage_date) lines.push(`2 DATE ${escapeLine(family.marriage_date)}`);
    if (family.marriage_place) lines.push(`2 PLAC ${escapeLine(family.marriage_place)}`);
  }
  if (family.divorce_date) {
    lines.push('1 DIV');
    lines.push(`2 DATE ${escapeLine(family.divorce_date)}`);
  }
  return lines;
}

export function exportGedcom(graph) {
  const pointerFor = {
    person: (id) => `@I${id}@`,
    family: (id) => `@F${id}@`,
  };

  const lines = [
    '0 HEAD',
    '1 SOUR genealogy-app',
    '1 GEDC',
    '2 VERS 5.5.1',
    '2 FORM LINEAGE-LINKED',
    '1 CHAR UTF-8',
  ];

  for (const person of graph.persons) {
    lines.push(...formatIndividual(person, pointerFor));
  }
  for (const family of graph.families) {
    lines.push(...formatFamily(family, pointerFor));
  }
  lines.push('0 TRLR');

  return lines.join('\n');
}

export function downloadGedcomFile(text, filename = 'export.ged') {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

If `individual.getName().valueAsParts()` or the `.value()`/`.pointer()` calls on `getHusband()`/`getWife()`/`getChild()` don't behave as written here, check the actual runtime shape via the test run and adjust - a prior task in this project's history (server-side GEDCOM import) hit exactly this and fixed it by switching some calls from `.pointer()` to `.value()`; the code above already reflects that fix, but verify against the real `read-gedcom` version installed.

- [ ] **Step 5: Run test to verify it passes**

Run: `cd client && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 6: Commit**

```bash
cd /Users/sara.czelusniak/workspace/nauka/genealogy-app
git add client/package.json client/package-lock.json client/src/data/gedcomRepo.js client/src/data/gedcomRepo.test.js
git commit -m "feat: add local GEDCOM import/export/download"
```

---

### Task 8: `api` facade (`client/src/data/index.js`)

**Files:**
- Create: `client/src/data/index.js`
- Create: `client/src/data/index.test.js`

**Interfaces:**
- Consumes: everything from Tasks 2-7.
- Produces: the `api` object that `App.vue`, `PersonForm.vue`, `FamilyEditor.vue`, `GedcomPanel.vue`, `EventPhotoUpload.vue` import from now on: `listPersons, getPerson, createPerson, updatePerson, deletePerson, listFamilies, getFamily, createFamily, updateFamily, addChild, getTree, listEventPhotos, uploadEventPhoto, deleteEventPhoto, importGedcomFile, exportGedcomFile`.

- [ ] **Step 1: Write the failing test**

Create `client/src/data/index.test.js`:

```js
import { describe, it, expect, vi } from 'vitest';
import { api } from './index.js';

describe('api facade', () => {
  it('creates a person and finds it via getTree', async () => {
    const created = await api.createPerson({ first_name: 'Jan', last_name: 'Kowalski' });
    const graph = await api.getTree();
    expect(graph.persons.some((p) => p.id === created.id)).toBe(true);
  });

  it('creates a family, adds a child, and reflects it in getTree', async () => {
    const husband = await api.createPerson({ first_name: 'Jan' });
    const child = await api.createPerson({ first_name: 'Piotr' });
    const family = await api.createFamily({ husband_id: husband.id });
    await api.addChild(family.id, child.id, 'birth');

    const graph = await api.getTree();
    const found = graph.families.find((f) => f.id === family.id);
    expect(found.children).toEqual([{ child_id: child.id, pedigree: 'birth' }]);
  });

  it('uploads and lists an event photo for a person', async () => {
    const person = await api.createPerson({ first_name: 'Anna' });
    const file = new File(['fake-jpeg'], 'a.jpg', { type: 'image/jpeg' });

    await api.uploadEventPhoto({ owner_type: 'person', owner_id: person.id, event_type: 'birth', file });
    const photos = await api.listEventPhotos('person', person.id);

    expect(photos).toHaveLength(1);
    expect(photos[0].event_type).toBe('birth');
  });

  it('exports gedcom by triggering a download', async () => {
    document.createElement = vi.fn(document.createElement.bind(document));
    await api.createPerson({ first_name: 'Jan', last_name: 'Kowalski' });
    await expect(api.exportGedcomFile()).resolves.not.toThrow();
  });
});
```

Note: this test shares one IndexedDB database across all its own test cases (the facade in `index.js` opens a single, fixed `'genealogy'` database at module load) - that's intentional here since there's only one facade instance for the whole app at runtime, same as production. If test isolation becomes a problem (e.g. flakiness from shared state across `it` blocks), add a `beforeEach` that clears all three stores via direct `db.clear()` calls rather than renaming the database.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run src/data/index.test.js`
Expected: FAIL - `./index.js` does not exist.

- [ ] **Step 3: Create `client/src/data/index.js`**

```js
import { openGenealogyDb } from './db.js';
import { createPersonRepo } from './personRepo.js';
import { createFamilyRepo } from './familyRepo.js';
import { createTreeRepo } from './treeRepo.js';
import { createEventPhotoRepo } from './eventPhotoRepo.js';
import { importGedcomIntoRepos, exportGedcom, downloadGedcomFile } from './gedcomRepo.js';

const dbPromise = openGenealogyDb();

async function getRepos() {
  const db = await dbPromise;
  return {
    persons: createPersonRepo(db),
    families: createFamilyRepo(db),
    tree: createTreeRepo(db),
    eventPhotos: createEventPhotoRepo(db),
  };
}

export const api = {
  listPersons: async () => (await getRepos()).persons.list(),
  getPerson: async (id) => (await getRepos()).persons.get(id),
  createPerson: async (data) => (await getRepos()).persons.create(data),
  updatePerson: async (id, data) => (await getRepos()).persons.update(id, data),
  deletePerson: async (id) => (await getRepos()).persons.remove(id),

  listFamilies: async () => (await getRepos()).families.list(),
  getFamily: async (id) => (await getRepos()).families.get(id),
  createFamily: async (data) => (await getRepos()).families.create(data),
  updateFamily: async (id, data) => (await getRepos()).families.update(id, data),
  addChild: async (familyId, childId, pedigree = 'birth') =>
    (await getRepos()).families.addChild(familyId, childId, pedigree),

  getTree: async () => (await getRepos()).tree.getGraph(),

  listEventPhotos: async (ownerType, ownerId) => (await getRepos()).eventPhotos.listByOwner(ownerType, ownerId),
  uploadEventPhoto: async ({ owner_type, owner_id, event_type, file }) =>
    (await getRepos()).eventPhotos.upsert({ owner_type, owner_id, event_type, blob: file, original_name: file.name }),
  deleteEventPhoto: async (id) => (await getRepos()).eventPhotos.remove(id),

  importGedcomFile: async (arrayBuffer) => {
    const repos = await getRepos();
    return importGedcomIntoRepos(repos.persons, repos.families, arrayBuffer);
  },
  exportGedcomFile: async () => {
    const repos = await getRepos();
    const graph = await repos.tree.getGraph();
    const text = exportGedcom(graph);
    downloadGedcomFile(text);
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/sara.czelusniak/workspace/nauka/genealogy-app
git add client/src/data/index.js client/src/data/index.test.js
git commit -m "feat: add unified local api facade"
```

---

### Task 9: Switch `App.vue` to the local facade, remove the old HTTP client

**Files:**
- Modify: `client/src/App.vue`
- Modify: `client/src/App.test.js`
- Delete: `client/src/api/client.js`
- Delete: `client/src/api/client.test.js`

**Interfaces:**
- Produces: `App.vue` now imports `api` from `../data/index.js`; the old HTTP-based client is gone.

- [ ] **Step 1: Modify `client/src/App.vue`**

Change only this one line (everything else in the file - template, other script logic, styles - stays exactly as it is):

```js
import { api } from './api/client.js';
```

becomes:

```js
import { api } from './data/index.js';
```

- [ ] **Step 2: Modify `client/src/App.test.js`**

Replace the whole file with:

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import App from './App.vue';
import { api } from './data/index.js';

vi.mock('./data/index.js', () => ({
  api: {
    getTree: vi.fn(),
  },
}));

describe('App', () => {
  beforeEach(() => {
    api.getTree.mockResolvedValue({
      persons: [{ id: 1, first_name: 'Jan', last_name: 'Kowalski', birth_date: '1950', death_date: null }],
      families: [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads the tree on mount and renders a person card', async () => {
    const wrapper = mount(App);
    await flushPromises();
    expect(wrapper.text()).toContain('Jan Kowalski');
  });

  it('opens the person form when "Nowa osoba" is clicked', async () => {
    const wrapper = mount(App);
    await flushPromises();
    await wrapper.find('button[data-action="new-person"]').trigger('click');
    expect(wrapper.findComponent({ name: 'PersonForm' }).exists()).toBe(true);
  });
});
```

- [ ] **Step 3: Delete the old HTTP client**

Run: `rm client/src/api/client.js client/src/api/client.test.js && rmdir client/src/api`

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx vitest run`
Expected: `src/api/client.test.js` is gone from the run (no file to fail); `src/App.test.js` passes. Other component test files (`PersonForm.test.js`, `GedcomPanel.test.js`) will still fail at this point if they haven't been updated yet - that's expected and resolved in Tasks 10-12.

- [ ] **Step 5: Commit**

```bash
cd /Users/sara.czelusniak/workspace/nauka/genealogy-app
git add -A client/src/App.vue client/src/App.test.js client/src/api
git commit -m "feat: switch App.vue to the local data facade, remove HTTP client"
```

---

### Task 10: `EventPhotoUpload` component (adapted for local storage)

**Files:**
- Create: `client/src/components/EventPhotoUpload.vue`
- Create: `client/src/components/EventPhotoUpload.test.js`

**Interfaces:**
- Consumes: `api.uploadEventPhoto`, `api.deleteEventPhoto` (Task 8, mocked in tests).
- Produces: `EventPhotoUpload` component, props `{ ownerType: String, ownerId: Number, eventType: String, label: String, photo: Object | null }`, emits `changed()`. Used by Task 11's `PersonForm.vue`.

- [ ] **Step 1: Write the failing test**

Create `client/src/components/EventPhotoUpload.test.js`:

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import EventPhotoUpload from './EventPhotoUpload.vue';
import { api } from '../data/index.js';

vi.mock('../data/index.js', () => ({
  api: {
    uploadEventPhoto: vi.fn(),
    deleteEventPhoto: vi.fn(),
  },
}));

describe('EventPhotoUpload', () => {
  beforeEach(() => {
    api.uploadEventPhoto.mockResolvedValue({ id: 1 });
    api.deleteEventPhoto.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows a file input when there is no photo yet', () => {
    const wrapper = mount(EventPhotoUpload, {
      props: { ownerType: 'person', ownerId: 1, eventType: 'birth', label: 'Zdjecie urodzenia', photo: null },
    });
    expect(wrapper.find('input[type="file"]').exists()).toBe(true);
  });

  it('uploads a jpeg file and emits changed', async () => {
    const wrapper = mount(EventPhotoUpload, {
      props: { ownerType: 'person', ownerId: 1, eventType: 'birth', label: 'Zdjecie urodzenia', photo: null },
    });
    const input = wrapper.find('input[type="file"]');
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    Object.defineProperty(input.element, 'files', { value: [file] });
    await input.trigger('change');
    await new Promise((resolve) => setTimeout(resolve));

    expect(api.uploadEventPhoto).toHaveBeenCalledWith({
      owner_type: 'person',
      owner_id: 1,
      event_type: 'birth',
      file,
    });
    expect(wrapper.emitted('changed')).toBeTruthy();
  });

  it('rejects a non-jpeg file without calling the api', async () => {
    const wrapper = mount(EventPhotoUpload, {
      props: { ownerType: 'person', ownerId: 1, eventType: 'birth', label: 'Zdjecie urodzenia', photo: null },
    });
    const input = wrapper.find('input[type="file"]');
    const file = new File(['x'], 'photo.png', { type: 'image/png' });
    Object.defineProperty(input.element, 'files', { value: [file] });
    await input.trigger('change');

    expect(api.uploadEventPhoto).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('JPG');
  });

  it('shows a thumbnail and remove button when a photo exists, and removes it', async () => {
    const photo = { id: 7, url: 'blob:mock-url' };
    const wrapper = mount(EventPhotoUpload, {
      props: { ownerType: 'person', ownerId: 1, eventType: 'death', label: 'Zdjecie zgonu', photo },
    });
    expect(wrapper.find('img').attributes('src')).toBe('blob:mock-url');

    await wrapper.find('button').trigger('click');
    await new Promise((resolve) => setTimeout(resolve));

    expect(api.deleteEventPhoto).toHaveBeenCalledWith(7);
    expect(wrapper.emitted('changed')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run src/components/EventPhotoUpload.test.js`
Expected: FAIL - `./EventPhotoUpload.vue` does not exist.

- [ ] **Step 3: Create `client/src/components/EventPhotoUpload.vue`**

```vue
<script setup>
import { ref } from 'vue';
import { api } from '../data/index.js';

const props = defineProps({
  ownerType: { type: String, required: true },
  ownerId: { type: Number, required: true },
  eventType: { type: String, required: true },
  label: { type: String, required: true },
  photo: { type: Object, default: null },
});
const emit = defineEmits(['changed']);

const uploading = ref(false);
const error = ref('');

async function handleFileChange(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.type !== 'image/jpeg') {
    error.value = 'Dozwolone sa tylko pliki JPG';
    event.target.value = '';
    return;
  }
  uploading.value = true;
  error.value = '';
  try {
    await api.uploadEventPhoto({
      owner_type: props.ownerType,
      owner_id: props.ownerId,
      event_type: props.eventType,
      file,
    });
    emit('changed');
  } catch (err) {
    error.value = err.message;
  } finally {
    uploading.value = false;
    event.target.value = '';
  }
}

async function removePhoto() {
  if (!props.photo) return;
  await api.deleteEventPhoto(props.photo.id);
  emit('changed');
}
</script>

<template>
  <div class="event-photo">
    <span class="event-photo-label">{{ label }}</span>
    <div v-if="photo" class="event-photo-existing">
      <img :src="photo.url" alt="" class="event-photo-thumb" />
      <button type="button" @click="removePhoto">Usun zdjecie</button>
    </div>
    <input v-else type="file" accept="image/jpeg" @change="handleFileChange" />
    <span v-if="uploading" class="event-photo-status">Zapisywanie...</span>
    <span v-if="error" class="event-photo-error">{{ error }}</span>
  </div>
</template>

<style scoped>
.event-photo {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.event-photo-label {
  font-size: 0.85rem;
  color: var(--color-text-muted, #6b7280);
  min-width: 170px;
}

.event-photo-existing {
  display: flex;
  align-items: center;
  gap: 10px;
}

.event-photo-thumb {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--color-border, #d8dce1);
}

.event-photo-status {
  font-size: 0.8rem;
  color: var(--color-text-muted, #6b7280);
}

.event-photo-error {
  font-size: 0.8rem;
  color: #c0392b;
}
</style>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx vitest run src/components/EventPhotoUpload.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/sara.czelusniak/workspace/nauka/genealogy-app
git add client/src/components/EventPhotoUpload.vue client/src/components/EventPhotoUpload.test.js
git commit -m "feat: add EventPhotoUpload component backed by local storage"
```

---

### Task 11: `PersonForm.vue` - maiden name field + event photo integration

**Files:**
- Modify: `client/src/components/PersonForm.vue`
- Modify: `client/src/components/PersonForm.test.js`

**Interfaces:**
- Consumes: `api.listEventPhotos` (Task 8), `EventPhotoUpload` (Task 10).
- Produces: `PersonForm` now emits `maiden_name` in its `save` payload, and (only when `props.person` has an `id`) renders two `EventPhotoUpload` instances for `birth`/`death`.

- [ ] **Step 1: Replace the entire contents of `client/src/components/PersonForm.test.js`**

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import PersonForm from './PersonForm.vue';
import { api } from '../data/index.js';

vi.mock('../data/index.js', () => ({
  api: {
    listEventPhotos: vi.fn(),
  },
}));

describe('PersonForm', () => {
  beforeEach(() => {
    api.listEventPhotos.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('pre-fills fields from the person prop', async () => {
    const person = { id: 1, first_name: 'Jan', last_name: 'Kowalski', maiden_name: '', sex: 'M', birth_date: '1950' };
    const wrapper = mount(PersonForm, { props: { person } });
    await flushPromises();
    expect(wrapper.find('input[name="first_name"]').element.value).toBe('Jan');
    expect(wrapper.find('input[name="birth_date"]').element.value).toBe('1950');
  });

  it('pre-fills maiden name when present', async () => {
    const person = { id: 2, first_name: 'Anna', last_name: 'Kowalska', maiden_name: 'Nowak', sex: 'F' };
    const wrapper = mount(PersonForm, { props: { person } });
    await flushPromises();
    expect(wrapper.find('input[name="maiden_name"]').element.value).toBe('Nowak');
  });

  it('emits save with form data on submit', async () => {
    const wrapper = mount(PersonForm, { props: { person: null } });
    await flushPromises();
    await wrapper.find('input[name="first_name"]').setValue('Anna');
    await wrapper.find('input[name="last_name"]').setValue('Nowak');
    await wrapper.find('form').trigger('submit');

    const saved = wrapper.emitted('save')[0][0];
    expect(saved.first_name).toBe('Anna');
    expect(saved.last_name).toBe('Nowak');
  });

  it('emits cancel when cancel is clicked', async () => {
    const wrapper = mount(PersonForm, { props: { person: null } });
    await flushPromises();
    await wrapper.find('button[type="button"]').trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('does not show event photo uploads for a new (unsaved) person', async () => {
    const wrapper = mount(PersonForm, { props: { person: null } });
    await flushPromises();
    expect(wrapper.findComponent({ name: 'EventPhotoUpload' }).exists()).toBe(false);
  });

  it('shows event photo uploads when editing an existing person', async () => {
    const person = { id: 3, first_name: 'Jan', last_name: 'Kowalski' };
    const wrapper = mount(PersonForm, { props: { person } });
    await flushPromises();
    expect(wrapper.findAllComponents({ name: 'EventPhotoUpload' })).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd client && npx vitest run src/components/PersonForm.test.js`
Expected: FAIL - no `maiden_name` input, no `EventPhotoUpload` usage yet.

- [ ] **Step 3: Replace the entire contents of `client/src/components/PersonForm.vue`**

```vue
<script setup>
import { reactive, ref, watch } from 'vue';
import { api } from '../data/index.js';
import EventPhotoUpload from './EventPhotoUpload.vue';

const props = defineProps({ person: { type: Object, default: null } });
const emit = defineEmits(['save', 'cancel']);

const form = reactive({
  first_name: '',
  last_name: '',
  maiden_name: '',
  sex: 'U',
  birth_date: '',
  birth_place: '',
  death_date: '',
  death_place: '',
  notes: '',
});

const eventPhotos = ref([]);

async function loadEventPhotos() {
  if (!props.person?.id) {
    eventPhotos.value = [];
    return;
  }
  eventPhotos.value = await api.listEventPhotos('person', props.person.id);
}

function photoFor(eventType) {
  return eventPhotos.value.find((p) => p.event_type === eventType) ?? null;
}

watch(
  () => props.person,
  (person) => {
    Object.assign(form, {
      first_name: person?.first_name ?? '',
      last_name: person?.last_name ?? '',
      maiden_name: person?.maiden_name ?? '',
      sex: person?.sex ?? 'U',
      birth_date: person?.birth_date ?? '',
      birth_place: person?.birth_place ?? '',
      death_date: person?.death_date ?? '',
      death_place: person?.death_place ?? '',
      notes: person?.notes ?? '',
    });
    loadEventPhotos();
  },
  { immediate: true }
);

function submit() {
  emit('save', { ...form });
}
</script>

<template>
  <form class="person-form" @submit.prevent="submit">
    <h3 class="form-title">{{ person ? 'Edytuj osobe' : 'Nowa osoba' }}</h3>
    <div class="form-grid">
      <label>Imie <input name="first_name" v-model="form.first_name" /></label>
      <label>Nazwisko <input name="last_name" v-model="form.last_name" /></label>
      <label>Nazwisko rodowe <input name="maiden_name" v-model="form.maiden_name" /></label>
      <label>
        Plec
        <select name="sex" v-model="form.sex">
          <option value="M">M</option>
          <option value="F">F</option>
          <option value="U">U</option>
        </select>
      </label>
      <label>Data urodzenia <input name="birth_date" v-model="form.birth_date" placeholder="12 MAR 1950" /></label>
      <label>Miejsce urodzenia <input name="birth_place" v-model="form.birth_place" /></label>
      <label>Data smierci <input name="death_date" v-model="form.death_date" /></label>
      <label>Miejsce smierci <input name="death_place" v-model="form.death_place" /></label>
    </div>
    <label class="notes-field">Notatki <textarea name="notes" v-model="form.notes" rows="3"></textarea></label>

    <div v-if="person?.id" class="event-photos">
      <EventPhotoUpload
        owner-type="person"
        :owner-id="person.id"
        event-type="birth"
        label="Zdjecie aktu urodzenia"
        :photo="photoFor('birth')"
        @changed="loadEventPhotos"
      />
      <EventPhotoUpload
        owner-type="person"
        :owner-id="person.id"
        event-type="death"
        label="Zdjecie aktu zgonu"
        :photo="photoFor('death')"
        @changed="loadEventPhotos"
      />
    </div>

    <div class="form-actions">
      <button type="submit">Zapisz</button>
      <button type="button" @click="emit('cancel')">Anuluj</button>
    </div>
  </form>
</template>

<style scoped>
.form-title {
  margin-bottom: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
}

.notes-field {
  margin-top: 12px;
}

.event-photos {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
</style>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd client && npx vitest run src/components/PersonForm.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/sara.czelusniak/workspace/nauka/genealogy-app
git add client/src/components/PersonForm.vue client/src/components/PersonForm.test.js
git commit -m "feat: add maiden name field and event photo uploads to PersonForm"
```

---

### Task 12: `GedcomPanel.vue` - local import/export

**Files:**
- Modify: `client/src/components/GedcomPanel.vue`
- Modify: `client/src/components/GedcomPanel.test.js`

**Interfaces:**
- Consumes: `api.importGedcomFile`, `api.exportGedcomFile` (Task 8).
- Produces: `GedcomPanel` emits `imported(result)` exactly as before (`App.vue`'s `reloadAfterImport` needs no changes), export is now a button instead of a link.

- [ ] **Step 1: Replace the entire contents of `client/src/components/GedcomPanel.test.js`**

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import GedcomPanel from './GedcomPanel.vue';
import { api } from '../data/index.js';

vi.mock('../data/index.js', () => ({
  api: {
    importGedcomFile: vi.fn(),
    exportGedcomFile: vi.fn(),
  },
}));

describe('GedcomPanel', () => {
  beforeEach(() => {
    api.importGedcomFile.mockResolvedValue({ personCount: 1, familyCount: 0 });
    api.exportGedcomFile.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('emits imported after a successful file import', async () => {
    const wrapper = mount(GedcomPanel);
    const input = wrapper.find('input[type="file"]');
    const file = new File(['0 HEAD'], 'sample.ged', { type: 'text/plain' });
    Object.defineProperty(input.element, 'files', { value: [file] });

    await input.trigger('change');
    await new Promise((resolve) => setTimeout(resolve));

    expect(api.importGedcomFile).toHaveBeenCalled();
    expect(wrapper.emitted('imported')).toBeTruthy();
    expect(wrapper.emitted('imported')[0][0]).toEqual({ personCount: 1, familyCount: 0 });
  });

  it('calls exportGedcomFile when the export button is clicked', async () => {
    const wrapper = mount(GedcomPanel);
    await wrapper.find('.export-button').trigger('click');
    expect(api.exportGedcomFile).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd client && npx vitest run src/components/GedcomPanel.test.js`
Expected: FAIL - component still calls `fetch`, not `api.importGedcomFile`/`api.exportGedcomFile`.

- [ ] **Step 3: Replace the entire contents of `client/src/components/GedcomPanel.vue`**

```vue
<script setup>
import { ref } from 'vue';
import { api } from '../data/index.js';

const emit = defineEmits(['imported']);
const importing = ref(false);
const error = ref('');

async function handleFileChange(event) {
  const file = event.target.files[0];
  if (!file) return;
  importing.value = true;
  error.value = '';
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await api.importGedcomFile(arrayBuffer);
    emit('imported', result);
  } catch (err) {
    error.value = err.message;
  } finally {
    importing.value = false;
    event.target.value = '';
  }
}

async function handleExport() {
  await api.exportGedcomFile();
}
</script>

<template>
  <div class="gedcom-panel">
    <label class="upload-button">
      Importuj GEDCOM
      <input type="file" accept=".ged" @change="handleFileChange" hidden />
    </label>
    <button type="button" class="export-button" @click="handleExport">Eksportuj GEDCOM</button>
    <span v-if="importing" class="status">Importowanie...</span>
    <span v-if="error" class="error">{{ error }}</span>
  </div>
</template>

<style scoped>
.gedcom-panel {
  display: flex;
  align-items: center;
  gap: 10px;
}

.upload-button,
.export-button {
  display: inline-flex;
  align-items: center;
  font-size: 0.9rem;
  padding: 8px 14px;
  border: 1px solid var(--color-border, #d8dce1);
  border-radius: 8px;
  background: var(--color-surface, #fff);
  color: var(--color-text, #1f2430);
  cursor: pointer;
}

.upload-button:hover,
.export-button:hover {
  border-color: var(--color-primary, #3b5bdb);
}

.status {
  color: var(--color-text-muted, #6b7280);
  font-size: 0.85rem;
}

.error {
  color: #c0392b;
  font-size: 0.85rem;
}
</style>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd client && npx vitest run`
Expected: PASS (all tests in the whole client suite).

- [ ] **Step 5: Commit**

```bash
cd /Users/sara.czelusniak/workspace/nauka/genealogy-app
git add client/src/components/GedcomPanel.vue client/src/components/GedcomPanel.test.js
git commit -m "feat: make GEDCOM import/export fully local (no fetch)"
```

---

### Task 13: GitHub Pages base path (Vite config, manifest, service worker)

**Files:**
- Modify: `client/vite.config.js`
- Modify: `client/index.html`
- Modify: `client/public/manifest.webmanifest`
- Modify: `client/src/main.js`

**Interfaces:**
- Produces: a client build whose asset URLs, manifest, icons, and service worker all resolve correctly when served from `https://czelsa.github.io/genealogy-app/`.

- [ ] **Step 1: Modify `client/vite.config.js`**

Add `base` to the `defineConfig` call (keep `plugins` and `test` exactly as they are from Task 1, keep the existing `server.proxy` block too even though it will be unused once there's no backend - removing it is not necessary):

```js
export default defineConfig({
  base: '/genealogy-app/',
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test-setup.js'],
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
```

- [ ] **Step 2: Modify `client/index.html`**

Change the manifest/icon links to use Vite's `%BASE_URL%` placeholder:

```html
<link rel="manifest" href="%BASE_URL%manifest.webmanifest" />
<link rel="apple-touch-icon" href="%BASE_URL%icon-192.png" />
<link rel="icon" href="%BASE_URL%icon-192.png" />
```

(replace the existing three lines that currently start with `href="/manifest.webmanifest"`, `href="/icon-192.png"` - everything else in `index.html` stays the same)

- [ ] **Step 3: Modify `client/public/manifest.webmanifest`**

Replace its contents with (relative icon paths and `start_url: "."` so it works regardless of the base path):

```json
{
  "name": "Drzewo genealogiczne",
  "short_name": "Drzewo",
  "start_url": ".",
  "display": "standalone",
  "background_color": "#f7f8fa",
  "theme_color": "#3b5bdb",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

- [ ] **Step 4: Modify `client/src/main.js`**

Change the service worker registration to respect the base path:

```js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
}
```

- [ ] **Step 5: Verify the build**

Run: `cd client && npm run build`
Expected: no errors. Inspect `client/dist/index.html` and confirm asset `src`/`href` attributes are prefixed with `/genealogy-app/`.

- [ ] **Step 6: Commit**

```bash
cd /Users/sara.czelusniak/workspace/nauka/genealogy-app
git add client/vite.config.js client/index.html client/public/manifest.webmanifest client/src/main.js
git commit -m "chore: configure base path for GitHub Pages deployment"
```

---

### Task 14: Remove the server and Docker/Render artifacts

**Files:**
- Delete: `server/` (entire directory)
- Delete: `Dockerfile`
- Delete: `.dockerignore`
- Delete: `render.yaml`
- Modify: `.gitignore`

**Interfaces:**
- Produces: a repo containing only `client/` and `docs/` - no backend, no container config.

- [ ] **Step 1: Confirm nothing in `client/` still references `server/`**

Run: `cd client && grep -rn "server/" src/ || echo "no references"`
Expected: `no references` (Tasks 1-13 already removed every HTTP call to the old backend).

- [ ] **Step 2: Delete the server and container files**

```bash
cd /Users/sara.czelusniak/workspace/nauka/genealogy-app
rm -rf server Dockerfile .dockerignore render.yaml
```

- [ ] **Step 3: Modify `.gitignore`**

Replace its contents with:

```
node_modules/
client/dist/
.sdd/
```

- [ ] **Step 4: Run the full client test suite once more**

Run: `cd client && npx vitest run`
Expected: PASS (all tests - removing `server/` doesn't touch anything `client/` depends on).

- [ ] **Step 5: Commit**

```bash
cd /Users/sara.czelusniak/workspace/nauka/genealogy-app
git add -A
git commit -m "chore: remove server, Dockerfile, and Render config (app is now a static client)"
```

---

### Task 15: GitHub Actions deploy to GitHub Pages

**Files:**
- Create: `.github/workflows/deploy-pages.yml`

**Interfaces:**
- Produces: on every push to `main`, builds `client/` and publishes `client/dist` to GitHub Pages.

- [ ] **Step 1: Create `.github/workflows/deploy-pages.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
        working-directory: client
      - run: npm run build
        working-directory: client
      - uses: actions/upload-pages-artifact@v3
        with:
          path: client/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit and push**

```bash
cd /Users/sara.czelusniak/workspace/nauka/genealogy-app
git add .github/workflows/deploy-pages.yml
git commit -m "ci: deploy client to GitHub Pages on push to main"
gh auth switch --user czelsa
git push
gh auth switch --user sara-czelusniak_with
```

- [ ] **Step 3: Enable "Pages: Source = GitHub Actions" on the repo**

Run (as the `czelsa` account):

```bash
gh auth switch --user czelsa
gh api -X POST repos/czelsa/genealogy-app/pages -f build_type=workflow 2>&1 || \
  gh api -X PUT repos/czelsa/genealogy-app/pages -f build_type=workflow
gh auth switch --user sara-czelusniak_with
```

(the `POST` creates the Pages site if it doesn't exist yet; if it already exists, `POST` fails and the fallback `PUT` updates its build type - run whichever succeeds)

- [ ] **Step 4: Watch the workflow run**

Run: `gh run list --repo czelsa/genealogy-app --limit 1` and `gh run watch --repo czelsa/genealogy-app` (as whichever account - read access is enough) to confirm the build+deploy job succeeds.
Expected: workflow completes successfully, and `gh api repos/czelsa/genealogy-app/pages` reports a `html_url` of `https://czelsa.github.io/genealogy-app/`.

---

### Task 16: End-to-end smoke test

**Files:**
- No new files. Verification-only task.

- [ ] **Step 1: Run the full client test suite**

Run: `cd client && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 2: Build and preview locally**

Run: `cd client && npm run build && npx vite preview`
Expected: prints a local URL (e.g. `http://localhost:4173/genealogy-app/`) - open it.

- [ ] **Step 3: Manually verify in the local preview**

- Create a person with a maiden name - confirm the tree card shows `(z d. <maiden_name>)`.
- Edit that person, upload a `.jpg` under "Zdjecie aktu urodzenia" - confirm a thumbnail appears.
- Upload a non-JPG file - confirm it's rejected with a visible error, not silently ignored.
- Click "Usun zdjecie" - confirm the thumbnail disappears.
- Create a second person, link them as a family (spouse + child).
- Import `server`'s former fixture GEDCOM content (recreate a small `.ged` file by hand if the original `server/test/fixtures/sample.ged` was deleted in Task 14) and confirm persons/families appear and the tree re-roots onto the imported data.
- Click "Eksportuj GEDCOM" - confirm a `.ged` file downloads.
- Reload the page (full browser refresh) - confirm all the data is still there (proves IndexedDB persistence survives a reload, not just the in-memory session).

- [ ] **Step 4: Verify the live GitHub Pages deployment**

Open `https://czelsa.github.io/genealogy-app/` in a browser (ideally also on a phone, on a different network, to prove it's truly public and serverless) and repeat a quick version of Step 3's checks (create a person, confirm it persists after a reload). On Android Chrome, confirm "Add to Home Screen" offers to install the PWA.

- [ ] **Step 5: Report completion.** No further commit needed unless Step 3/4 surfaced a bug - if so, fix it, re-run the affected test(s), and commit/push that fix on its own.
