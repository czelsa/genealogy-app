# Genealogy Tree App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-user web app to create/edit genealogical trees by hand, visualize them as a hierarchical SVG tree, and import/export GEDCOM files.

**Architecture:** Two independent Node projects in one repo: `server/` (Express + better-sqlite3, REST API) and `client/` (Vue 3 + Vite SPA). In production, the client is built and served statically by Express from one process/port.

**Tech Stack:** Node.js (ESM), Express 4, better-sqlite3, multer, read-gedcom (GEDCOM parsing), Vue 3, Vite, Vitest, supertest, @vue/test-utils.

## Global Constraints

- Single user, no authentication/login anywhere in the app.
- Data model matches GEDCOM 1:1 (Person / Family / FamilyChild) per spec `docs/superpowers/specs/2026-10-27-genealogy-tree-app-design.md`.
- Dates stored as raw GEDCOM-style text (e.g. "12 MAR 1950"), never parsed into a Date object server-side.
- GEDCOM import uses the `read-gedcom` npm library; GEDCOM export is hand-written (no export library).
- Import is transactional: whole file succeeds or nothing is written.
- Tree visualization is hand-rolled SVG (no D3 or graph-layout library).
- No comments in code except where this plan's code blocks are shown verbatim (match the user's global no-comments convention when implementing).

---

### Task 1: Server scaffold + health endpoint

**Files:**
- Create: `server/package.json`
- Create: `server/src/app.js`
- Create: `server/src/server.js`
- Create: `server/test/app.test.js`
- Create: `server/.gitignore`

**Interfaces:**
- Produces: `createApp(db?)` exported from `server/src/app.js`, returns an Express app instance. Later tasks import and extend this function.

- [ ] **Step 1: Create `server/package.json`**

```json
{
  "name": "genealogy-server",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "node src/server.js",
    "test": "vitest run"
  },
  "dependencies": {
    "express": "^4.19.2"
  },
  "devDependencies": {
    "vitest": "^2.1.4",
    "supertest": "^7.0.0"
  }
}
```

- [ ] **Step 2: Create `server/.gitignore`**

```
node_modules/
data/
```

- [ ] **Step 3: Install dependencies**

Run: `cd server && npm install`
Expected: `node_modules` created, no errors.

- [ ] **Step 4: Write the failing test**

Create `server/test/app.test.js`:

```js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('health check', () => {
  it('returns ok', async () => {
    const app = createApp();
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `cd server && npx vitest run`
Expected: FAIL - `../src/app.js` does not exist.

- [ ] **Step 6: Create `server/src/app.js`**

```js
import express from 'express';

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  return app;
}
```

- [ ] **Step 7: Create `server/src/server.js`**

```js
import { createApp } from './app.js';

const port = process.env.PORT || 3001;
const app = createApp();
app.listen(port, () => console.log(`server listening on ${port}`));
```

- [ ] **Step 8: Run test to verify it passes**

Run: `cd server && npx vitest run`
Expected: PASS (1 test).

- [ ] **Step 9: Commit**

```bash
git init
git add server/package.json server/.gitignore server/src/app.js server/src/server.js server/test/app.test.js
git commit -m "chore: scaffold server with health endpoint"
```

---

### Task 2: SQLite schema and connection module

**Files:**
- Create: `server/src/db/schema.sql`
- Create: `server/src/db/connection.js`
- Create: `server/test/connection.test.js`
- Modify: `server/package.json` (add `better-sqlite3` dependency)

**Interfaces:**
- Consumes: nothing new.
- Produces: `createDb(path?)` exported from `server/src/db/connection.js`. Returns a `better-sqlite3` `Database` instance with schema applied. `path` defaults to `server/data/genealogy.db`; pass `':memory:'` in tests.

- [ ] **Step 1: Add dependency**

Edit `server/package.json`, add to `dependencies`:

```json
"better-sqlite3": "^11.3.0"
```

Run: `cd server && npm install`

- [ ] **Step 2: Create `server/src/db/schema.sql`**

```sql
CREATE TABLE IF NOT EXISTS person (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT,
  last_name TEXT,
  sex TEXT CHECK(sex IN ('M','F','U')) NOT NULL DEFAULT 'U',
  birth_date TEXT,
  birth_place TEXT,
  death_date TEXT,
  death_place TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS family (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  husband_id INTEGER REFERENCES person(id),
  wife_id INTEGER REFERENCES person(id),
  marriage_date TEXT,
  marriage_place TEXT,
  divorce_date TEXT
);

CREATE TABLE IF NOT EXISTS family_child (
  family_id INTEGER NOT NULL REFERENCES family(id),
  child_id INTEGER NOT NULL REFERENCES person(id),
  pedigree TEXT CHECK(pedigree IN ('birth','adopted','foster')) NOT NULL DEFAULT 'birth',
  PRIMARY KEY (family_id, child_id)
);
```

- [ ] **Step 3: Write the failing test**

Create `server/test/connection.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/db/connection.js';

describe('createDb', () => {
  it('creates the person table', () => {
    const db = createDb(':memory:');
    const info = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='person'").get();
    expect(info.name).toBe('person');
  });

  it('allows inserting and reading a person', () => {
    const db = createDb(':memory:');
    db.prepare('INSERT INTO person (first_name, last_name) VALUES (?, ?)').run('Jan', 'Kowalski');
    const row = db.prepare('SELECT * FROM person WHERE first_name = ?').get('Jan');
    expect(row.last_name).toBe('Kowalski');
    expect(row.sex).toBe('U');
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd server && npx vitest run`
Expected: FAIL - `../src/db/connection.js` does not exist.

- [ ] **Step 5: Create `server/src/db/connection.js`**

```js
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createDb(path = join(__dirname, '../../data/genealogy.db')) {
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
  return db;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd server && npx vitest run`
Expected: PASS (3 tests total).

- [ ] **Step 7: Commit**

```bash
git add server/package.json server/package-lock.json server/src/db server/test/connection.test.js
git commit -m "feat: add SQLite schema and db connection module"
```

---

### Task 3: Person CRUD API

**Files:**
- Create: `server/src/services/personService.js`
- Create: `server/src/routes/persons.js`
- Modify: `server/src/app.js`
- Create: `server/test/persons.test.js`

**Interfaces:**
- Consumes: `createDb` from Task 2.
- Produces: `createPersonService(db)` returning `{ list(), get(id), create(data), update(id, data), remove(id) }`. `personsRouter(personService)` returning an Express `Router` mounted at `/api/persons`. `createApp(db = createDb())` now accepts an optional db for test injection.

- [ ] **Step 1: Write the failing test**

Create `server/test/persons.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createDb } from '../src/db/connection.js';

describe('persons API', () => {
  let app;

  beforeEach(() => {
    app = createApp(createDb(':memory:'));
  });

  it('creates and fetches a person', async () => {
    const created = await request(app)
      .post('/api/persons')
      .send({ first_name: 'Anna', last_name: 'Nowak', sex: 'F' });
    expect(created.status).toBe(201);
    expect(created.body.id).toBeTypeOf('number');

    const fetched = await request(app).get(`/api/persons/${created.body.id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.first_name).toBe('Anna');
  });

  it('returns 404 for missing person', async () => {
    const response = await request(app).get('/api/persons/999');
    expect(response.status).toBe(404);
  });

  it('updates a person', async () => {
    const created = await request(app).post('/api/persons').send({ first_name: 'Jan' });
    const updated = await request(app)
      .put(`/api/persons/${created.body.id}`)
      .send({ first_name: 'Janek', last_name: 'Kowalski' });
    expect(updated.body.first_name).toBe('Janek');
  });

  it('deletes a person', async () => {
    const created = await request(app).post('/api/persons').send({ first_name: 'Ewa' });
    const deleted = await request(app).delete(`/api/persons/${created.body.id}`);
    expect(deleted.status).toBe(204);
    const fetched = await request(app).get(`/api/persons/${created.body.id}`);
    expect(fetched.status).toBe(404);
  });

  it('lists persons', async () => {
    await request(app).post('/api/persons').send({ first_name: 'A', last_name: 'Z' });
    await request(app).post('/api/persons').send({ first_name: 'B', last_name: 'Y' });
    const response = await request(app).get('/api/persons');
    expect(response.body.length).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run`
Expected: FAIL - `createApp(db)` does not accept an argument / routes 404.

- [ ] **Step 3: Create `server/src/services/personService.js`**

```js
function normalize(data) {
  return {
    first_name: data.first_name ?? null,
    last_name: data.last_name ?? null,
    sex: ['M', 'F'].includes(data.sex) ? data.sex : 'U',
    birth_date: data.birth_date ?? null,
    birth_place: data.birth_place ?? null,
    death_date: data.death_date ?? null,
    death_place: data.death_place ?? null,
    notes: data.notes ?? null,
  };
}

export function createPersonService(db) {
  const insertStmt = db.prepare(`INSERT INTO person
    (first_name, last_name, sex, birth_date, birth_place, death_date, death_place, notes)
    VALUES (@first_name, @last_name, @sex, @birth_date, @birth_place, @death_date, @death_place, @notes)`);
  const updateStmt = db.prepare(`UPDATE person SET
    first_name=@first_name, last_name=@last_name, sex=@sex,
    birth_date=@birth_date, birth_place=@birth_place,
    death_date=@death_date, death_place=@death_place, notes=@notes
    WHERE id=@id`);
  const deleteStmt = db.prepare('DELETE FROM person WHERE id = ?');
  const getStmt = db.prepare('SELECT * FROM person WHERE id = ?');
  const listStmt = db.prepare('SELECT * FROM person ORDER BY last_name, first_name');

  return {
    list() {
      return listStmt.all();
    },
    get(id) {
      return getStmt.get(id);
    },
    create(data) {
      const info = insertStmt.run(normalize(data));
      return getStmt.get(info.lastInsertRowid);
    },
    update(id, data) {
      updateStmt.run({ ...normalize(data), id });
      return getStmt.get(id);
    },
    remove(id) {
      deleteStmt.run(id);
    },
  };
}
```

- [ ] **Step 4: Create `server/src/routes/persons.js`**

```js
import { Router } from 'express';

export function personsRouter(personService) {
  const router = Router();

  router.get('/', (req, res) => {
    res.json(personService.list());
  });

  router.get('/:id', (req, res) => {
    const person = personService.get(Number(req.params.id));
    if (!person) return res.status(404).json({ error: 'not found' });
    res.json(person);
  });

  router.post('/', (req, res) => {
    res.status(201).json(personService.create(req.body));
  });

  router.put('/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!personService.get(id)) return res.status(404).json({ error: 'not found' });
    res.json(personService.update(id, req.body));
  });

  router.delete('/:id', (req, res) => {
    personService.remove(Number(req.params.id));
    res.status(204).end();
  });

  return router;
}
```

- [ ] **Step 5: Modify `server/src/app.js`**

```js
import express from 'express';
import { createDb } from './db/connection.js';
import { createPersonService } from './services/personService.js';
import { personsRouter } from './routes/persons.js';

export function createApp(db = createDb()) {
  const app = express();
  app.use(express.json());

  const personService = createPersonService(db);

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/persons', personsRouter(personService));

  return app;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd server && npx vitest run`
Expected: PASS (all tests, including Task 1/2 tests).

- [ ] **Step 7: Commit**

```bash
git add server/src/services/personService.js server/src/routes/persons.js server/src/app.js server/test/persons.test.js
git commit -m "feat: add person CRUD API"
```

---

### Task 4: Family CRUD API + children

**Files:**
- Create: `server/src/services/familyService.js`
- Create: `server/src/routes/families.js`
- Modify: `server/src/app.js`
- Create: `server/test/families.test.js`

**Interfaces:**
- Consumes: `createPersonService` pattern from Task 3 (not directly, but same db).
- Produces: `createFamilyService(db)` returning `{ list(), get(id), create(data), update(id, data), remove(id), addChild(familyId, childId, pedigree), removeChild(familyId, childId) }`. Family objects returned always include a `children: [{ child_id, pedigree }]` array. `familiesRouter(familyService)` mounted at `/api/families`.

- [ ] **Step 1: Write the failing test**

Create `server/test/families.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createDb } from '../src/db/connection.js';

describe('families API', () => {
  let app;

  beforeEach(() => {
    app = createApp(createDb(':memory:'));
  });

  async function createPerson(name) {
    const response = await request(app).post('/api/persons').send({ first_name: name });
    return response.body.id;
  }

  it('creates a family with husband and wife', async () => {
    const husbandId = await createPerson('Jan');
    const wifeId = await createPerson('Anna');

    const created = await request(app)
      .post('/api/families')
      .send({ husband_id: husbandId, wife_id: wifeId, marriage_date: '1 JAN 1980' });

    expect(created.status).toBe(201);
    expect(created.body.husband_id).toBe(husbandId);
    expect(created.body.children).toEqual([]);
  });

  it('adds a child to a family', async () => {
    const husbandId = await createPerson('Jan');
    const childId = await createPerson('Piotr');
    const family = await request(app).post('/api/families').send({ husband_id: husbandId });

    const withChild = await request(app)
      .post(`/api/families/${family.body.id}/children`)
      .send({ child_id: childId, pedigree: 'birth' });

    expect(withChild.status).toBe(201);
    expect(withChild.body.children).toEqual([{ child_id: childId, pedigree: 'birth' }]);
  });

  it('returns 404 adding a child to a missing family', async () => {
    const childId = await createPerson('Piotr');
    const response = await request(app).post('/api/families/999/children').send({ child_id: childId });
    expect(response.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run`
Expected: FAIL - no `/api/families` route.

- [ ] **Step 3: Create `server/src/services/familyService.js`**

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

export function createFamilyService(db) {
  const insertStmt = db.prepare(`INSERT INTO family
    (husband_id, wife_id, marriage_date, marriage_place, divorce_date)
    VALUES (@husband_id, @wife_id, @marriage_date, @marriage_place, @divorce_date)`);
  const updateStmt = db.prepare(`UPDATE family SET
    husband_id=@husband_id, wife_id=@wife_id, marriage_date=@marriage_date,
    marriage_place=@marriage_place, divorce_date=@divorce_date
    WHERE id=@id`);
  const deleteStmt = db.prepare('DELETE FROM family WHERE id = ?');
  const deleteChildrenStmt = db.prepare('DELETE FROM family_child WHERE family_id = ?');
  const getStmt = db.prepare('SELECT * FROM family WHERE id = ?');
  const listStmt = db.prepare('SELECT * FROM family');
  const addChildStmt = db.prepare(
    'INSERT OR REPLACE INTO family_child (family_id, child_id, pedigree) VALUES (?, ?, ?)'
  );
  const childrenStmt = db.prepare('SELECT child_id, pedigree FROM family_child WHERE family_id = ?');
  const removeChildStmt = db.prepare('DELETE FROM family_child WHERE family_id = ? AND child_id = ?');

  function withChildren(family) {
    if (!family) return undefined;
    return { ...family, children: childrenStmt.all(family.id) };
  }

  return {
    list() {
      return listStmt.all().map(withChildren);
    },
    get(id) {
      return withChildren(getStmt.get(id));
    },
    create(data) {
      const info = insertStmt.run(normalize(data));
      return withChildren(getStmt.get(info.lastInsertRowid));
    },
    update(id, data) {
      updateStmt.run({ ...normalize(data), id });
      return withChildren(getStmt.get(id));
    },
    remove(id) {
      deleteChildrenStmt.run(id);
      deleteStmt.run(id);
    },
    addChild(familyId, childId, pedigree = 'birth') {
      addChildStmt.run(familyId, childId, pedigree);
      return withChildren(getStmt.get(familyId));
    },
    removeChild(familyId, childId) {
      removeChildStmt.run(familyId, childId);
      return withChildren(getStmt.get(familyId));
    },
  };
}
```

- [ ] **Step 4: Create `server/src/routes/families.js`**

```js
import { Router } from 'express';

export function familiesRouter(familyService) {
  const router = Router();

  router.get('/', (req, res) => {
    res.json(familyService.list());
  });

  router.get('/:id', (req, res) => {
    const family = familyService.get(Number(req.params.id));
    if (!family) return res.status(404).json({ error: 'not found' });
    res.json(family);
  });

  router.post('/', (req, res) => {
    res.status(201).json(familyService.create(req.body));
  });

  router.put('/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!familyService.get(id)) return res.status(404).json({ error: 'not found' });
    res.json(familyService.update(id, req.body));
  });

  router.delete('/:id', (req, res) => {
    familyService.remove(Number(req.params.id));
    res.status(204).end();
  });

  router.post('/:id/children', (req, res) => {
    const id = Number(req.params.id);
    if (!familyService.get(id)) return res.status(404).json({ error: 'not found' });
    res.status(201).json(familyService.addChild(id, Number(req.body.child_id), req.body.pedigree));
  });

  router.delete('/:id/children/:childId', (req, res) => {
    res.json(familyService.removeChild(Number(req.params.id), Number(req.params.childId)));
  });

  return router;
}
```

- [ ] **Step 5: Modify `server/src/app.js`**

```js
import express from 'express';
import { createDb } from './db/connection.js';
import { createPersonService } from './services/personService.js';
import { personsRouter } from './routes/persons.js';
import { createFamilyService } from './services/familyService.js';
import { familiesRouter } from './routes/families.js';

export function createApp(db = createDb()) {
  const app = express();
  app.use(express.json());

  const personService = createPersonService(db);
  const familyService = createFamilyService(db);

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/persons', personsRouter(personService));
  app.use('/api/families', familiesRouter(familyService));

  return app;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd server && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 7: Commit**

```bash
git add server/src/services/familyService.js server/src/routes/families.js server/src/app.js server/test/families.test.js
git commit -m "feat: add family CRUD API with child linking"
```

---

### Task 5: Tree graph endpoint

**Files:**
- Create: `server/src/services/treeService.js`
- Create: `server/src/routes/tree.js`
- Modify: `server/src/app.js`
- Create: `server/test/tree.test.js`

**Interfaces:**
- Produces: `createTreeService(db)` returning `{ getGraph() }` where `getGraph()` returns `{ persons: Person[], families: FamilyWithChildren[] }` for the whole dataset. `treeRouter(treeService)` mounted at `/api/tree`, `GET /api/tree` returns that graph.

- [ ] **Step 1: Write the failing test**

Create `server/test/tree.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createDb } from '../src/db/connection.js';

describe('tree API', () => {
  let app;

  beforeEach(() => {
    app = createApp(createDb(':memory:'));
  });

  it('returns persons and families with children', async () => {
    const husband = await request(app).post('/api/persons').send({ first_name: 'Jan' });
    const wife = await request(app).post('/api/persons').send({ first_name: 'Anna' });
    const child = await request(app).post('/api/persons').send({ first_name: 'Piotr' });
    const family = await request(app)
      .post('/api/families')
      .send({ husband_id: husband.body.id, wife_id: wife.body.id });
    await request(app).post(`/api/families/${family.body.id}/children`).send({ child_id: child.body.id });

    const response = await request(app).get('/api/tree');

    expect(response.status).toBe(200);
    expect(response.body.persons.length).toBe(3);
    expect(response.body.families.length).toBe(1);
    expect(response.body.families[0].children).toEqual([{ child_id: child.body.id, pedigree: 'birth' }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run`
Expected: FAIL - no `/api/tree` route.

- [ ] **Step 3: Create `server/src/services/treeService.js`**

```js
export function createTreeService(db) {
  const personsStmt = db.prepare('SELECT * FROM person');
  const familiesStmt = db.prepare('SELECT * FROM family');
  const childLinksStmt = db.prepare('SELECT family_id, child_id, pedigree FROM family_child');

  return {
    getGraph() {
      const persons = personsStmt.all();
      const families = familiesStmt.all();
      const childLinks = childLinksStmt.all();
      const familiesWithChildren = families.map((family) => ({
        ...family,
        children: childLinks
          .filter((link) => link.family_id === family.id)
          .map((link) => ({ child_id: link.child_id, pedigree: link.pedigree })),
      }));
      return { persons, families: familiesWithChildren };
    },
  };
}
```

- [ ] **Step 4: Create `server/src/routes/tree.js`**

```js
import { Router } from 'express';

export function treeRouter(treeService) {
  const router = Router();

  router.get('/', (req, res) => {
    res.json(treeService.getGraph());
  });

  return router;
}
```

- [ ] **Step 5: Modify `server/src/app.js`**

```js
import express from 'express';
import { createDb } from './db/connection.js';
import { createPersonService } from './services/personService.js';
import { personsRouter } from './routes/persons.js';
import { createFamilyService } from './services/familyService.js';
import { familiesRouter } from './routes/families.js';
import { createTreeService } from './services/treeService.js';
import { treeRouter } from './routes/tree.js';

export function createApp(db = createDb()) {
  const app = express();
  app.use(express.json());

  const personService = createPersonService(db);
  const familyService = createFamilyService(db);
  const treeService = createTreeService(db);

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/persons', personsRouter(personService));
  app.use('/api/families', familiesRouter(familyService));
  app.use('/api/tree', treeRouter(treeService));

  return app;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd server && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 7: Commit**

```bash
git add server/src/services/treeService.js server/src/routes/tree.js server/src/app.js server/test/tree.test.js
git commit -m "feat: add tree graph endpoint"
```

---

### Task 6: GEDCOM import

**Files:**
- Create: `server/src/services/gedcomImport.js`
- Create: `server/src/routes/gedcom.js`
- Modify: `server/src/app.js`
- Modify: `server/package.json` (add `read-gedcom`, `multer`)
- Create: `server/test/fixtures/sample.ged`
- Create: `server/test/gedcomImport.test.js`

**Interfaces:**
- Produces: `parseGedcomBuffer(arrayBuffer)` returning `{ persons: ParsedPerson[], families: ParsedFamily[] }` (pointer-id based, not yet inserted). `importGedcomIntoDb(db, arrayBuffer)` returning `{ personCount, familyCount }`, runs in a single SQLite transaction. `gedcomRouter(db, treeService)` mounted at `/api/gedcom`, exposes `POST /api/gedcom/import` (multipart field `file`).

- [ ] **Step 1: Add dependencies**

Edit `server/package.json`, add to `dependencies`:

```json
"multer": "^1.4.5-lts.1",
"read-gedcom": "^0.3.2"
```

Run: `cd server && npm install`

- [ ] **Step 2: Create fixture `server/test/fixtures/sample.ged`**

```
0 HEAD
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
```

- [ ] **Step 3: Write the failing test**

Create `server/test/gedcomImport.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createDb } from '../src/db/connection.js';
import { parseGedcomBuffer, importGedcomIntoDb } from '../src/services/gedcomImport.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadFixtureArrayBuffer() {
  const buffer = readFileSync(join(__dirname, 'fixtures/sample.ged'));
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

describe('parseGedcomBuffer', () => {
  it('parses individuals and families', () => {
    const { persons, families } = parseGedcomBuffer(loadFixtureArrayBuffer());

    expect(persons).toHaveLength(3);
    const jan = persons.find((p) => p.pointerId === '@I1@');
    expect(jan.first_name).toBe('Jan');
    expect(jan.last_name).toBe('Kowalski');
    expect(jan.sex).toBe('M');
    expect(jan.birth_date).toBe('1 JAN 1950');
    expect(jan.birth_place).toBe('Warszawa');

    expect(families).toHaveLength(1);
    expect(families[0].husbandPointerId).toBe('@I1@');
    expect(families[0].wifePointerId).toBe('@I2@');
    expect(families[0].childPointerIds).toEqual(['@I3@']);
    expect(families[0].marriage_date).toBe('1 JUN 1974');
  });
});

describe('importGedcomIntoDb', () => {
  it('inserts persons and families transactionally', () => {
    const db = createDb(':memory:');
    const result = importGedcomIntoDb(db, loadFixtureArrayBuffer());

    expect(result).toEqual({ personCount: 3, familyCount: 1 });

    const persons = db.prepare('SELECT * FROM person').all();
    expect(persons).toHaveLength(3);

    const families = db.prepare('SELECT * FROM family').all();
    expect(families).toHaveLength(1);

    const children = db.prepare('SELECT * FROM family_child').all();
    expect(children).toHaveLength(1);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd server && npx vitest run`
Expected: FAIL - `../src/services/gedcomImport.js` does not exist.

- [ ] **Step 5: Create `server/src/services/gedcomImport.js`**

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
    return {
      pointerId: firstPointer(individual),
      first_name: firstValue(individual.getName().getGivenName()),
      last_name: firstValue(individual.getName().getSurname()),
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
      pointerId: firstPointer(family),
      husbandPointerId: firstPointer(family.getHusband()),
      wifePointerId: firstPointer(family.getWife()),
      marriage_date: firstValue(marriage.getDate()),
      marriage_place: firstValue(marriage.getPlace()),
      divorce_date: firstValue(divorce.getDate()),
      childPointerIds: family.getChild().pointer().filter(Boolean),
    };
  });

  return { persons, families };
}

export function importGedcomIntoDb(db, arrayBuffer) {
  const { persons, families } = parseGedcomBuffer(arrayBuffer);

  const insertPerson = db.prepare(`INSERT INTO person
    (first_name, last_name, sex, birth_date, birth_place, death_date, death_place, notes)
    VALUES (@first_name, @last_name, @sex, @birth_date, @birth_place, @death_date, @death_place, @notes)`);
  const insertFamily = db.prepare(`INSERT INTO family
    (husband_id, wife_id, marriage_date, marriage_place, divorce_date)
    VALUES (@husband_id, @wife_id, @marriage_date, @marriage_place, @divorce_date)`);
  const insertChild = db.prepare(
    "INSERT INTO family_child (family_id, child_id, pedigree) VALUES (?, ?, 'birth')"
  );

  const run = db.transaction(() => {
    const idByPointer = new Map();
    for (const person of persons) {
      const info = insertPerson.run(person);
      idByPointer.set(person.pointerId, info.lastInsertRowid);
    }
    for (const family of families) {
      const info = insertFamily.run({
        husband_id: idByPointer.get(family.husbandPointerId) ?? null,
        wife_id: idByPointer.get(family.wifePointerId) ?? null,
        marriage_date: family.marriage_date,
        marriage_place: family.marriage_place,
        divorce_date: family.divorce_date,
      });
      for (const childPointer of family.childPointerIds) {
        const childId = idByPointer.get(childPointer);
        if (childId != null) insertChild.run(info.lastInsertRowid, childId);
      }
    }
    return { personCount: persons.length, familyCount: families.length };
  });

  return run();
}
```

- [ ] **Step 6: Create `server/src/routes/gedcom.js`**

```js
import { Router } from 'express';
import multer from 'multer';
import { importGedcomIntoDb } from '../services/gedcomImport.js';

const upload = multer({ storage: multer.memoryStorage() });

export function gedcomRouter(db) {
  const router = Router();

  router.post('/import', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'file is required' });
    try {
      const buffer = req.file.buffer;
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      const result = importGedcomIntoDb(db, arrayBuffer);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}
```

- [ ] **Step 7: Modify `server/src/app.js`**

Add import and mount:

```js
import { gedcomRouter } from './routes/gedcom.js';
```

```js
  app.use('/api/gedcom', gedcomRouter(db));
```

(placed after the `/api/tree` mount, before `return app;`)

- [ ] **Step 8: Run test to verify it passes**

Run: `cd server && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 9: Commit**

```bash
git add server/package.json server/package-lock.json server/src/services/gedcomImport.js server/src/routes/gedcom.js server/src/app.js server/test/fixtures/sample.ged server/test/gedcomImport.test.js
git commit -m "feat: add transactional GEDCOM import"
```

---

### Task 7: GEDCOM export

**Files:**
- Create: `server/src/services/gedcomExport.js`
- Modify: `server/src/routes/gedcom.js`
- Modify: `server/src/app.js`
- Create: `server/test/gedcomExport.test.js`

**Interfaces:**
- Consumes: `createTreeService(db).getGraph()` from Task 5.
- Produces: `exportGedcom(graph)` returning a GEDCOM text string. `GET /api/gedcom/export` on the gedcom router returns that text with `Content-Disposition: attachment`.

- [ ] **Step 1: Write the failing test**

Create `server/test/gedcomExport.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { exportGedcom } from '../src/services/gedcomExport.js';

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
    expect(text).toContain('1 SEX M');
    expect(text).toContain('2 DATE 1 JAN 1950');
    expect(text).toContain('0 @F1@ FAM');
    expect(text).toContain('1 HUSB @I1@');
    expect(text).toContain('1 WIFE @I2@');
    expect(text).toContain('0 TRLR');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run`
Expected: FAIL - `../src/services/gedcomExport.js` does not exist.

- [ ] **Step 3: Create `server/src/services/gedcomExport.js`**

```js
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
```

- [ ] **Step 4: Modify `server/src/routes/gedcom.js`**

Replace the whole file:

```js
import { Router } from 'express';
import multer from 'multer';
import { importGedcomIntoDb } from '../services/gedcomImport.js';
import { exportGedcom } from '../services/gedcomExport.js';

const upload = multer({ storage: multer.memoryStorage() });

export function gedcomRouter(db, treeService) {
  const router = Router();

  router.post('/import', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'file is required' });
    try {
      const buffer = req.file.buffer;
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      const result = importGedcomIntoDb(db, arrayBuffer);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get('/export', (req, res) => {
    const graph = treeService.getGraph();
    const gedcomText = exportGedcom(graph);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="export.ged"');
    res.send(gedcomText);
  });

  return router;
}
```

- [ ] **Step 5: Modify `server/src/app.js`**

Change the mount line to pass `treeService`:

```js
  app.use('/api/gedcom', gedcomRouter(db, treeService));
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd server && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 7: Commit**

```bash
git add server/src/services/gedcomExport.js server/src/routes/gedcom.js server/src/app.js server/test/gedcomExport.test.js
git commit -m "feat: add GEDCOM export"
```

---

### Task 8: Serve client build from Express

**Files:**
- Modify: `server/src/app.js`
- Create: `server/test/staticServing.test.js`

**Interfaces:**
- Produces: `createApp` now serves `client/dist` as static files when that directory exists, with a catch-all route returning `index.html` for non-`/api` paths (SPA routing).

- [ ] **Step 1: Write the failing test**

Create `server/test/staticServing.test.js`:

```js
import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createApp } from '../src/app.js';
import { createDb } from '../src/db/connection.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '../../client/dist');

mkdirSync(distDir, { recursive: true });
writeFileSync(join(distDir, 'index.html'), '<html><body>genealogy</body></html>');

afterAll(() => {
  rmSync(distDir, { recursive: true, force: true });
});

describe('static client serving', () => {
  it('serves index.html for a non-api route', async () => {
    const app = createApp(createDb(':memory:'));
    const response = await request(app).get('/some/client/route');
    expect(response.status).toBe(200);
    expect(response.text).toContain('genealogy');
  });

  it('still serves the api', async () => {
    const app = createApp(createDb(':memory:'));
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run`
Expected: FAIL - `/some/client/route` returns 404.

- [ ] **Step 3: Modify `server/src/app.js`**

Add near the top:

```js
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDistDir = join(__dirname, '../../client/dist');
```

Add at the end of `createApp`, right before `return app;`:

```js
  if (existsSync(clientDistDir)) {
    app.use(express.static(clientDistDir));
    app.get(/^(?!\/api).*/, (req, res) => {
      res.sendFile(join(clientDistDir, 'index.html'));
    });
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add server/src/app.js server/test/staticServing.test.js
git commit -m "feat: serve built client as static files"
```

---

### Task 9: Client scaffold + API wrapper

**Files:**
- Create: `client/package.json`
- Create: `client/vite.config.js`
- Create: `client/index.html`
- Create: `client/src/main.js`
- Create: `client/src/App.vue`
- Create: `client/src/api/client.js`
- Create: `client/src/api/client.test.js`
- Create: `client/.gitignore`

**Interfaces:**
- Produces: `api` object exported from `client/src/api/client.js` with `listPersons, getPerson, createPerson, updatePerson, deletePerson, listFamilies, getFamily, createFamily, updateFamily, addChild, getTree` methods, each wrapping `fetch` against `/api`. Later tasks consume this.

- [ ] **Step 1: Create `client/package.json`**

```json
{
  "name": "genealogy-client",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run"
  },
  "dependencies": {
    "vue": "^3.5.12"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.1.4",
    "@vue/test-utils": "^2.4.6",
    "jsdom": "^25.0.0",
    "vite": "^5.4.11",
    "vitest": "^2.1.4"
  }
}
```

- [ ] **Step 2: Create `client/.gitignore`**

```
node_modules/
dist/
```

- [ ] **Step 3: Create `client/vite.config.js`**

```js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
```

- [ ] **Step 4: Create `client/index.html`**

```html
<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <title>Drzewo genealogiczne</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `client/src/main.js`**

```js
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
```

- [ ] **Step 6: Create `client/src/App.vue`**

```vue
<template>
  <div class="app">
    <h1>Drzewo genealogiczne</h1>
  </div>
</template>
```

- [ ] **Step 7: Install dependencies**

Run: `cd client && npm install`
Expected: no errors.

- [ ] **Step 8: Write the failing test**

Create `client/src/api/client.test.js`:

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from './client.js';

describe('api client', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists persons via GET /api/persons', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ id: 1, first_name: 'Jan' }],
    });

    const persons = await api.listPersons();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/persons',
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } })
    );
    expect(persons).toEqual([{ id: 1, first_name: 'Jan' }]);
  });

  it('throws with server error message on failure', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'bad request' }),
    });

    await expect(api.listPersons()).rejects.toThrow('bad request');
  });
});
```

- [ ] **Step 9: Run test to verify it fails**

Run: `cd client && npx vitest run`
Expected: FAIL - `./client.js` does not exist.

- [ ] **Step 10: Create `client/src/api/client.js`**

```js
const BASE_URL = '/api';

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  listPersons: () => request('/persons'),
  getPerson: (id) => request(`/persons/${id}`),
  createPerson: (data) => request('/persons', { method: 'POST', body: JSON.stringify(data) }),
  updatePerson: (id, data) => request(`/persons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePerson: (id) => request(`/persons/${id}`, { method: 'DELETE' }),

  listFamilies: () => request('/families'),
  getFamily: (id) => request(`/families/${id}`),
  createFamily: (data) => request('/families', { method: 'POST', body: JSON.stringify(data) }),
  updateFamily: (id, data) => request(`/families/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addChild: (familyId, childId, pedigree = 'birth') =>
    request(`/families/${familyId}/children`, {
      method: 'POST',
      body: JSON.stringify({ child_id: childId, pedigree }),
    }),

  getTree: () => request('/tree'),
};
```

- [ ] **Step 11: Run test to verify it passes**

Run: `cd client && npx vitest run`
Expected: PASS (2 tests).

- [ ] **Step 12: Commit**

```bash
git add client/package.json client/package-lock.json client/.gitignore client/vite.config.js client/index.html client/src/main.js client/src/App.vue client/src/api
git commit -m "chore: scaffold Vue client with API wrapper"
```

---

### Task 10: Tree layout algorithm

**Files:**
- Create: `client/src/tree/layout.js`
- Create: `client/src/tree/layout.test.js`

**Interfaces:**
- Produces: `layoutTree(graph, rootId)` returning `{ nodes: [{ id, person, x, y }], edges: [{ type: 'spouse' | 'parent-child', from: node, to: node }] }`. Used by `TreeView.vue` in Task 11.

- [ ] **Step 1: Write the failing test**

Create `client/src/tree/layout.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { layoutTree } from './layout.js';

function person(id, firstName) {
  return { id, first_name: firstName, last_name: '', birth_date: null, death_date: null };
}

describe('layoutTree', () => {
  it('places parents above the root and children below', () => {
    const graph = {
      persons: [person(1, 'Dziadek'), person(2, 'Babcia'), person(3, 'Rodzic'), person(4, 'Dziecko')],
      families: [
        { id: 10, husband_id: 1, wife_id: 2, children: [{ child_id: 3, pedigree: 'birth' }] },
        { id: 11, husband_id: 3, wife_id: null, children: [{ child_id: 4, pedigree: 'birth' }] },
      ],
    };

    const { nodes, edges } = layoutTree(graph, 3);

    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    expect(byId[3].y).toBeLessThan(byId[4].y);
    expect(byId[1].y).toBeLessThan(byId[3].y);
    expect(byId[2].y).toBe(byId[1].y);

    const spouseEdge = edges.find((e) => e.type === 'spouse' && e.from.id === 1);
    expect(spouseEdge.to.id).toBe(2);

    const parentChildEdge = edges.find((e) => e.type === 'parent-child' && e.to.id === 4);
    expect(parentChildEdge.from.id).toBe(3);
  });

  it('returns only the root when it has no relations', () => {
    const graph = { persons: [person(1, 'Solo')], families: [] };
    const { nodes, edges } = layoutTree(graph, 1);
    expect(nodes).toHaveLength(1);
    expect(edges).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run`
Expected: FAIL - `./layout.js` does not exist.

- [ ] **Step 3: Create `client/src/tree/layout.js`**

```js
const COLUMN_WIDTH = 180;
const ROW_HEIGHT = 140;

function findParentFamily(graph, personId) {
  return graph.families.find((family) =>
    family.children.some((child) => child.child_id === personId)
  );
}

function findSpouseFamilies(graph, personId) {
  return graph.families.filter(
    (family) => family.husband_id === personId || family.wife_id === personId
  );
}

function spouseOf(family, personId) {
  if (family.husband_id === personId) return family.wife_id;
  if (family.wife_id === personId) return family.husband_id;
  return null;
}

export function layoutTree(graph, rootId) {
  const personsById = new Map(graph.persons.map((p) => [p.id, p]));
  const generation = new Map([[rootId, 0]]);
  const visited = new Set();
  const queue = [[rootId, 0]];

  while (queue.length > 0) {
    const [personId, gen] = queue.shift();
    if (visited.has(personId)) continue;
    visited.add(personId);

    const parentFamily = findParentFamily(graph, personId);
    if (parentFamily) {
      for (const parentId of [parentFamily.husband_id, parentFamily.wife_id]) {
        if (parentId != null && !generation.has(parentId)) {
          generation.set(parentId, gen - 1);
          queue.push([parentId, gen - 1]);
        }
      }
    }

    for (const family of findSpouseFamilies(graph, personId)) {
      const spouseId = spouseOf(family, personId);
      if (spouseId != null && !generation.has(spouseId)) {
        generation.set(spouseId, gen);
        queue.push([spouseId, gen]);
      }
      for (const child of family.children) {
        if (!generation.has(child.child_id)) {
          generation.set(child.child_id, gen + 1);
          queue.push([child.child_id, gen + 1]);
        }
      }
    }
  }

  const rows = new Map();
  for (const [personId, gen] of generation.entries()) {
    if (!rows.has(gen)) rows.set(gen, []);
    rows.get(gen).push(personId);
  }

  const minGen = Math.min(...rows.keys());
  const nodes = [];
  for (const [gen, personIds] of rows.entries()) {
    personIds.forEach((personId, index) => {
      nodes.push({
        id: personId,
        person: personsById.get(personId),
        x: index * COLUMN_WIDTH,
        y: (gen - minGen) * ROW_HEIGHT,
      });
    });
  }

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const edges = [];
  for (const family of graph.families) {
    const husband = nodeById.get(family.husband_id);
    const wife = nodeById.get(family.wife_id);
    if (husband && wife) {
      edges.push({ type: 'spouse', from: husband, to: wife });
    }
    const parentNode = husband ?? wife;
    if (parentNode) {
      for (const child of family.children) {
        const childNode = nodeById.get(child.child_id);
        if (childNode) edges.push({ type: 'parent-child', from: parentNode, to: childNode });
      }
    }
  }

  return { nodes, edges };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add client/src/tree/layout.js client/src/tree/layout.test.js
git commit -m "feat: add tree layout algorithm"
```

---

### Task 11: TreeView SVG component

**Files:**
- Create: `client/src/components/TreeView.vue`
- Create: `client/src/components/TreeView.test.js`

**Interfaces:**
- Consumes: `layoutTree` from Task 10.
- Produces: `TreeView` component with props `{ graph: Object, rootId: Number }`, emits `select-person(personId)`.

- [ ] **Step 1: Write the failing test**

Create `client/src/components/TreeView.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TreeView from './TreeView.vue';

describe('TreeView', () => {
  const graph = {
    persons: [
      { id: 1, first_name: 'Jan', last_name: 'Kowalski', birth_date: '1950', death_date: null },
      { id: 2, first_name: 'Piotr', last_name: 'Kowalski', birth_date: '1975', death_date: null },
    ],
    families: [{ id: 10, husband_id: 1, wife_id: null, children: [{ child_id: 2, pedigree: 'birth' }] }],
  };

  it('renders a card per person', () => {
    const wrapper = mount(TreeView, { props: { graph, rootId: 1 } });
    const cards = wrapper.findAll('.person-card');
    expect(cards).toHaveLength(2);
    expect(wrapper.text()).toContain('Jan Kowalski');
  });

  it('emits select-person when a card is clicked', async () => {
    const wrapper = mount(TreeView, { props: { graph, rootId: 1 } });
    await wrapper.findAll('.person-card')[0].trigger('click');
    expect(wrapper.emitted('select-person')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run`
Expected: FAIL - `./TreeView.vue` does not exist.

- [ ] **Step 3: Create `client/src/components/TreeView.vue`**

```vue
<script setup>
import { computed } from 'vue';
import { layoutTree } from '../tree/layout.js';

const props = defineProps({
  graph: { type: Object, required: true },
  rootId: { type: Number, required: true },
});
const emit = defineEmits(['select-person']);

const layout = computed(() => layoutTree(props.graph, props.rootId));
const width = computed(() =>
  Math.max(600, ...layout.value.nodes.map((n) => n.x + 200))
);
const height = computed(() =>
  Math.max(400, ...layout.value.nodes.map((n) => n.y + 100))
);
</script>

<template>
  <svg :width="width" :height="height" class="tree-view">
    <line
      v-for="(edge, index) in layout.edges"
      :key="index"
      :x1="edge.from.x + 70"
      :y1="edge.from.y + 30"
      :x2="edge.to.x + 70"
      :y2="edge.to.y + 30"
      stroke="#888"
    />
    <g
      v-for="node in layout.nodes"
      :key="node.id"
      :transform="`translate(${node.x}, ${node.y})`"
      class="person-card"
      @click="emit('select-person', node.id)"
    >
      <rect width="140" height="60" rx="6" fill="#fff" stroke="#333" />
      <text x="70" y="24" text-anchor="middle">{{ node.person.first_name }} {{ node.person.last_name }}</text>
      <text x="70" y="44" text-anchor="middle" font-size="11">
        {{ node.person.birth_date || '?' }} - {{ node.person.death_date || '' }}
      </text>
    </g>
  </svg>
</template>

<style scoped>
.tree-view {
  background: #f5f5f5;
}
.person-card {
  cursor: pointer;
}
</style>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add client/src/components/TreeView.vue client/src/components/TreeView.test.js
git commit -m "feat: add SVG tree view component"
```

---

### Task 12: Person form component

**Files:**
- Create: `client/src/components/PersonForm.vue`
- Create: `client/src/components/PersonForm.test.js`

**Interfaces:**
- Produces: `PersonForm` component with prop `{ person: Object | null }`, emits `save(data)` and `cancel()`.

- [ ] **Step 1: Write the failing test**

Create `client/src/components/PersonForm.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PersonForm from './PersonForm.vue';

describe('PersonForm', () => {
  it('pre-fills fields from the person prop', () => {
    const person = { first_name: 'Jan', last_name: 'Kowalski', sex: 'M', birth_date: '1950' };
    const wrapper = mount(PersonForm, { props: { person } });
    expect(wrapper.find('input[name="first_name"]').element.value).toBe('Jan');
    expect(wrapper.find('input[name="birth_date"]').element.value).toBe('1950');
  });

  it('emits save with form data on submit', async () => {
    const wrapper = mount(PersonForm, { props: { person: null } });
    await wrapper.find('input[name="first_name"]').setValue('Anna');
    await wrapper.find('input[name="last_name"]').setValue('Nowak');
    await wrapper.find('form').trigger('submit');

    const saved = wrapper.emitted('save')[0][0];
    expect(saved.first_name).toBe('Anna');
    expect(saved.last_name).toBe('Nowak');
  });

  it('emits cancel when cancel is clicked', async () => {
    const wrapper = mount(PersonForm, { props: { person: null } });
    await wrapper.find('button[type="button"]').trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run`
Expected: FAIL - `./PersonForm.vue` does not exist.

- [ ] **Step 3: Create `client/src/components/PersonForm.vue`**

```vue
<script setup>
import { reactive, watch } from 'vue';

const props = defineProps({ person: { type: Object, default: null } });
const emit = defineEmits(['save', 'cancel']);

const form = reactive({
  first_name: '',
  last_name: '',
  sex: 'U',
  birth_date: '',
  birth_place: '',
  death_date: '',
  death_place: '',
  notes: '',
});

watch(
  () => props.person,
  (person) => {
    Object.assign(form, {
      first_name: person?.first_name ?? '',
      last_name: person?.last_name ?? '',
      sex: person?.sex ?? 'U',
      birth_date: person?.birth_date ?? '',
      birth_place: person?.birth_place ?? '',
      death_date: person?.death_date ?? '',
      death_place: person?.death_place ?? '',
      notes: person?.notes ?? '',
    });
  },
  { immediate: true }
);

function submit() {
  emit('save', { ...form });
}
</script>

<template>
  <form class="person-form" @submit.prevent="submit">
    <label>Imie <input name="first_name" v-model="form.first_name" /></label>
    <label>Nazwisko <input name="last_name" v-model="form.last_name" /></label>
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
    <label>Notatki <textarea name="notes" v-model="form.notes"></textarea></label>
    <button type="submit">Zapisz</button>
    <button type="button" @click="emit('cancel')">Anuluj</button>
  </form>
</template>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add client/src/components/PersonForm.vue client/src/components/PersonForm.test.js
git commit -m "feat: add person form component"
```

---

### Task 13: Family editor component

**Files:**
- Create: `client/src/components/FamilyEditor.vue`
- Create: `client/src/components/FamilyEditor.test.js`

**Interfaces:**
- Produces: `FamilyEditor` component with props `{ persons: Array, family: Object | null }`, emits `save-family(data)` and `cancel()`.

- [ ] **Step 1: Write the failing test**

Create `client/src/components/FamilyEditor.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FamilyEditor from './FamilyEditor.vue';

describe('FamilyEditor', () => {
  const persons = [
    { id: 1, first_name: 'Jan', last_name: 'Kowalski' },
    { id: 2, first_name: 'Anna', last_name: 'Nowak' },
  ];

  it('lists persons as husband/wife options', () => {
    const wrapper = mount(FamilyEditor, { props: { persons, family: null } });
    const husbandOptions = wrapper.find('select[name="husband_id"]').findAll('option');
    expect(husbandOptions).toHaveLength(3);
  });

  it('emits save-family with selected ids', async () => {
    const wrapper = mount(FamilyEditor, { props: { persons, family: null } });
    await wrapper.find('select[name="husband_id"]').setValue('1');
    await wrapper.find('select[name="wife_id"]').setValue('2');
    await wrapper.find('button[data-action="save"]').trigger('click');

    const saved = wrapper.emitted('save-family')[0][0];
    expect(saved.husband_id).toBe(1);
    expect(saved.wife_id).toBe(2);
  });

  it('emits cancel', async () => {
    const wrapper = mount(FamilyEditor, { props: { persons, family: null } });
    await wrapper.find('button[data-action="cancel"]').trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run`
Expected: FAIL - `./FamilyEditor.vue` does not exist.

- [ ] **Step 3: Create `client/src/components/FamilyEditor.vue`**

```vue
<script setup>
import { reactive } from 'vue';

const props = defineProps({
  persons: { type: Array, required: true },
  family: { type: Object, default: null },
});
const emit = defineEmits(['save-family', 'cancel']);

const form = reactive({
  husband_id: props.family?.husband_id ?? null,
  wife_id: props.family?.wife_id ?? null,
  marriage_date: props.family?.marriage_date ?? '',
  marriage_place: props.family?.marriage_place ?? '',
});

function save() {
  emit('save-family', { ...form });
}
</script>

<template>
  <div class="family-editor">
    <label>
      Maz
      <select name="husband_id" v-model.number="form.husband_id">
        <option :value="null">-</option>
        <option v-for="p in persons" :key="p.id" :value="p.id">{{ p.first_name }} {{ p.last_name }}</option>
      </select>
    </label>
    <label>
      Zona
      <select name="wife_id" v-model.number="form.wife_id">
        <option :value="null">-</option>
        <option v-for="p in persons" :key="p.id" :value="p.id">{{ p.first_name }} {{ p.last_name }}</option>
      </select>
    </label>
    <label>Data slubu <input v-model="form.marriage_date" /></label>
    <label>Miejsce slubu <input v-model="form.marriage_place" /></label>
    <button type="button" data-action="save" @click="save">Zapisz rodzine</button>
    <button type="button" data-action="cancel" @click="emit('cancel')">Anuluj</button>
  </div>
</template>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add client/src/components/FamilyEditor.vue client/src/components/FamilyEditor.test.js
git commit -m "feat: add family editor component"
```

---

### Task 14: GEDCOM import/export panel

**Files:**
- Create: `client/src/components/GedcomPanel.vue`
- Create: `client/src/components/GedcomPanel.test.js`

**Interfaces:**
- Produces: `GedcomPanel` component, emits `imported()` after a successful import. Export is a plain link/navigation to `/api/gedcom/export`, no emit needed.

- [ ] **Step 1: Write the failing test**

Create `client/src/components/GedcomPanel.test.js`:

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import GedcomPanel from './GedcomPanel.vue';

describe('GedcomPanel', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ personCount: 1 }) });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits imported after a successful file upload', async () => {
    const wrapper = mount(GedcomPanel);
    const input = wrapper.find('input[type="file"]');
    const file = new File(['0 HEAD'], 'sample.ged', { type: 'text/plain' });
    Object.defineProperty(input.element, 'files', { value: [file] });

    await input.trigger('change');
    await new Promise((resolve) => setTimeout(resolve));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/gedcom/import',
      expect.objectContaining({ method: 'POST' })
    );
    expect(wrapper.emitted('imported')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run`
Expected: FAIL - `./GedcomPanel.vue` does not exist.

- [ ] **Step 3: Create `client/src/components/GedcomPanel.vue`**

```vue
<script setup>
import { ref } from 'vue';

const emit = defineEmits(['imported']);
const importing = ref(false);
const error = ref('');

async function handleFileChange(event) {
  const file = event.target.files[0];
  if (!file) return;
  importing.value = true;
  error.value = '';
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/gedcom/import', { method: 'POST', body: formData });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'import failed');
    }
    emit('imported');
  } catch (err) {
    error.value = err.message;
  } finally {
    importing.value = false;
    event.target.value = '';
  }
}
</script>

<template>
  <div class="gedcom-panel">
    <label class="upload-button">
      Importuj GEDCOM
      <input type="file" accept=".ged" @change="handleFileChange" hidden />
    </label>
    <a class="export-button" href="/api/gedcom/export">Eksportuj GEDCOM</a>
    <span v-if="importing">Importowanie...</span>
    <span v-if="error" class="error">{{ error }}</span>
  </div>
</template>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add client/src/components/GedcomPanel.vue client/src/components/GedcomPanel.test.js
git commit -m "feat: add GEDCOM import/export panel"
```

---

### Task 15: Wire up App.vue

**Files:**
- Modify: `client/src/App.vue`
- Create: `client/src/App.test.js`

**Interfaces:**
- Consumes: `api` (Task 9), `TreeView` (Task 11), `PersonForm` (Task 12), `FamilyEditor` (Task 13), `GedcomPanel` (Task 14).
- Produces: the finished SPA shell. No further tasks consume this.

- [ ] **Step 1: Write the failing test**

Create `client/src/App.test.js`:

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import App from './App.vue';

describe('App', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        persons: [{ id: 1, first_name: 'Jan', last_name: 'Kowalski', birth_date: '1950', death_date: null }],
        families: [],
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run`
Expected: FAIL - no `data-action="new-person"` button exists yet.

- [ ] **Step 3: Rewrite `client/src/App.vue`**

```vue
<script setup>
import { ref, onMounted } from 'vue';
import { api } from './api/client.js';
import TreeView from './components/TreeView.vue';
import PersonForm from './components/PersonForm.vue';
import FamilyEditor from './components/FamilyEditor.vue';
import GedcomPanel from './components/GedcomPanel.vue';

const graph = ref({ persons: [], families: [] });
const rootId = ref(null);
const editingPerson = ref(null);
const showPersonForm = ref(false);
const showFamilyEditor = ref(false);

async function reload() {
  graph.value = await api.getTree();
  if (rootId.value == null && graph.value.persons.length > 0) {
    rootId.value = graph.value.persons[0].id;
  }
}

onMounted(reload);

function openNewPerson() {
  editingPerson.value = null;
  showPersonForm.value = true;
}

function openEditPerson(personId) {
  editingPerson.value = graph.value.persons.find((p) => p.id === personId) ?? null;
  showPersonForm.value = true;
}

async function savePerson(data) {
  if (editingPerson.value) {
    await api.updatePerson(editingPerson.value.id, data);
  } else {
    await api.createPerson(data);
  }
  showPersonForm.value = false;
  await reload();
}

async function saveFamily(data) {
  await api.createFamily(data);
  showFamilyEditor.value = false;
  await reload();
}
</script>

<template>
  <div class="app">
    <header>
      <h1>Drzewo genealogiczne</h1>
      <button type="button" data-action="new-person" @click="openNewPerson">Nowa osoba</button>
      <button type="button" data-action="new-family" @click="showFamilyEditor = true">Nowa rodzina</button>
      <GedcomPanel @imported="reload" />
    </header>
    <TreeView v-if="rootId != null" :graph="graph" :root-id="rootId" @select-person="openEditPerson" />
    <PersonForm
      v-if="showPersonForm"
      :person="editingPerson"
      @save="savePerson"
      @cancel="showPersonForm = false"
    />
    <FamilyEditor
      v-if="showFamilyEditor"
      :persons="graph.persons"
      @save-family="saveFamily"
      @cancel="showFamilyEditor = false"
    />
  </div>
</template>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add client/src/App.vue client/src/App.test.js
git commit -m "feat: wire up app shell with tree, forms, and GEDCOM panel"
```

---

### Task 16: End-to-end smoke test (build + manual run)

**Files:**
- No new files. Verification-only task.

**Interfaces:**
- None produced; this task validates the whole system built across Tasks 1-15.

- [ ] **Step 1: Run full server test suite**

Run: `cd server && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 2: Run full client test suite**

Run: `cd client && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 3: Build the client**

Run: `cd client && npm run build`
Expected: `client/dist/index.html` and bundled assets created, no errors.

- [ ] **Step 4: Start the server serving the built client**

Run: `cd server && npm run dev`
Expected: console prints `server listening on 3001`.

- [ ] **Step 5: Manually verify in browser**

Open `http://localhost:3001` and confirm:
- Page loads with empty tree (no persons yet).
- "Nowa osoba" creates a person, appears after save.
- "Nowa rodzina" links two persons as spouses and a child, tree redraws with correct generations.
- Importing `server/test/fixtures/sample.ged` via the GEDCOM panel populates 3 persons / 1 family, tree redraws.
- Clicking "Eksportuj GEDCOM" downloads a `.ged` file containing the same persons.

- [ ] **Step 6: Commit (if any fixups were needed during manual verification)**

```bash
git add -A
git commit -m "fix: address issues found during end-to-end smoke test"
```

(Skip this commit entirely if no fixes were needed.)
