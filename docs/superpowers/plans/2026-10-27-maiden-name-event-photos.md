# Nazwisko rodowe + zdjecia zdarzen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `maiden_name` to Person and a generic `event_photo` mechanism so a JPG scan can be attached to a person's birth/death event (and, at the API level, a family's marriage event).

**Architecture:** Extend the existing `server/` (Express + better-sqlite3) and `client/` (Vue 3) codebases in place, following their established service/route and component patterns.

**Tech Stack:** Same as the rest of the project - Node ESM, Express, better-sqlite3, multer, Vue 3 `<script setup>`, Vitest, supertest, @vue/test-utils.

## Global Constraints

- This project has **no git** - do not run any git commands anywhere in this plan (no init, no add, no commit). Skip any "Commit" step a template might otherwise include.
- Single user, no authentication.
- One photo per (`owner_type`, `owner_id`, `event_type`) - a new upload for the same triple replaces the previous file and DB row.
- Only `image/jpeg` uploads are accepted for event photos; anything else is rejected with 400.
- Photo files live on disk at `server/data/uploads/<uuid>.jpg`; the database stores only the file name, never binary data.
- GEDCOM import/export is NOT touched by this plan - photos are a local-only feature.
- UI for uploading a photo only appears when editing an **existing** person (one that already has an `id`); it is out of scope to support photo upload before first save.
- Marriage-event photos are fully supported by the API in this plan, but there is intentionally no Family-editing UI yet - do not add one.

---

### Task 1: DB migration - `person.maiden_name` + `event_photo` table

**Files:**
- Modify: `server/src/db/schema.sql`
- Modify: `server/src/db/connection.js`
- Modify: `server/test/connection.test.js`

**Interfaces:**
- Produces: `createDb(path?)` (already exists) now also guarantees `person.maiden_name` exists and the `event_photo` table exists, every time it is called, idempotently.

- [ ] **Step 1: Write the failing tests**

Append to `server/test/connection.test.js` (keep the existing tests in the file, add these):

```js
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join as joinPath } from 'path';
```

(add this import block near the top, alongside the existing `import { createDb } from '../src/db/connection.js';`)

```js
describe('maiden_name migration', () => {
  it('adds a maiden_name column to person', () => {
    const db = createDb(':memory:');
    const columns = db.prepare('PRAGMA table_info(person)').all().map((c) => c.name);
    expect(columns).toContain('maiden_name');
  });

  it('is idempotent when createDb runs twice against the same file', () => {
    const dir = mkdtempSync(joinPath(tmpdir(), 'genealogy-test-'));
    const dbPath = joinPath(dir, 'test.db');
    createDb(dbPath);
    expect(() => createDb(dbPath)).not.toThrow();
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('event_photo table', () => {
  it('is created by createDb', () => {
    const db = createDb(':memory:');
    const info = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='event_photo'").get();
    expect(info.name).toBe('event_photo');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npx vitest run test/connection.test.js`
Expected: FAIL - `maiden_name` column missing, `event_photo` table missing.

- [ ] **Step 3: Modify `server/src/db/schema.sql`**

Add this table definition at the end of the file (after the existing `family_child` table):

```sql
CREATE TABLE IF NOT EXISTS event_photo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_type TEXT CHECK(owner_type IN ('person','family')) NOT NULL,
  owner_id INTEGER NOT NULL,
  event_type TEXT CHECK(event_type IN ('birth','death','marriage')) NOT NULL,
  file_path TEXT NOT NULL,
  original_name TEXT,
  UNIQUE(owner_type, owner_id, event_type)
);
```

- [ ] **Step 4: Modify `server/src/db/connection.js`**

Change the body of `createDb` to add the column migration after `db.exec(schema);` and before `return db;`:

```js
  db.exec(schema);

  const personColumns = db.prepare('PRAGMA table_info(person)').all().map((c) => c.name);
  if (!personColumns.includes('maiden_name')) {
    db.exec('ALTER TABLE person ADD COLUMN maiden_name TEXT');
  }

  return db;
```

(leave everything else in the file - the `mkdirSync`, `new Database(path)`, and `db.pragma('journal_mode = WAL')` lines - unchanged)

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd server && npx vitest run`
Expected: PASS (all tests, including the new ones).

- [ ] **Step 6: No commit** - this project has no git. Move on to the next task.

---

### Task 2: Person API - `maiden_name` field

**Files:**
- Modify: `server/src/services/personService.js`
- Modify: `server/test/persons.test.js`

**Interfaces:**
- Produces: `createPersonService(db).create()/update()` now accept and persist `maiden_name`; `get()/list()` return it.

- [ ] **Step 1: Write the failing test**

Append to `server/test/persons.test.js` (inside the existing `describe('persons API', ...)` block, alongside the other `it(...)` cases):

```js
  it('stores and returns maiden_name', async () => {
    const created = await request(app)
      .post('/api/persons')
      .send({ first_name: 'Anna', last_name: 'Kowalska', maiden_name: 'Nowak', sex: 'F' });
    expect(created.body.maiden_name).toBe('Nowak');

    const fetched = await request(app).get(`/api/persons/${created.body.id}`);
    expect(fetched.body.maiden_name).toBe('Nowak');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run test/persons.test.js`
Expected: FAIL - `maiden_name` is `null` in the response (not persisted).

- [ ] **Step 3: Modify `server/src/services/personService.js`**

In the `normalize(data)` function, add `maiden_name` alongside the other fields:

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
```

Update `insertStmt` and `updateStmt` to include the column:

```js
  const insertStmt = db.prepare(`INSERT INTO person
    (first_name, last_name, maiden_name, sex, birth_date, birth_place, death_date, death_place, notes)
    VALUES (@first_name, @last_name, @maiden_name, @sex, @birth_date, @birth_place, @death_date, @death_place, @notes)`);
  const updateStmt = db.prepare(`UPDATE person SET
    first_name=@first_name, last_name=@last_name, maiden_name=@maiden_name, sex=@sex,
    birth_date=@birth_date, birth_place=@birth_place,
    death_date=@death_date, death_place=@death_place, notes=@notes
    WHERE id=@id`);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 5: No commit.**

---

### Task 3: Photo file storage helper

**Files:**
- Create: `server/src/services/photoStorage.js`
- Create: `server/test/photoStorage.test.js`

**Interfaces:**
- Produces: `saveUploadedPhoto(buffer): string` (returns a generated file name like `<uuid>.jpg`, writes it under `server/data/uploads/`), `deletePhotoFile(fileName): void` (no-op if missing), `photoFilePath(fileName): string` (absolute path on disk). Used by Task 5's routes.

- [ ] **Step 1: Write the failing test**

Create `server/test/photoStorage.test.js`:

```js
import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, rmSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { saveUploadedPhoto, deletePhotoFile, photoFilePath } from '../src/services/photoStorage.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsDir = join(__dirname, '../data/uploads');

afterEach(() => {
  rmSync(uploadsDir, { recursive: true, force: true });
});

describe('photoStorage', () => {
  it('saves a buffer to disk and returns a file name', () => {
    const fileName = saveUploadedPhoto(Buffer.from('hello'));
    expect(fileName).toMatch(/\.jpg$/);
    expect(existsSync(photoFilePath(fileName))).toBe(true);
  });

  it('deletes a saved file', () => {
    const fileName = saveUploadedPhoto(Buffer.from('hello'));
    deletePhotoFile(fileName);
    expect(existsSync(photoFilePath(fileName))).toBe(false);
  });

  it('does not throw when deleting a file that does not exist', () => {
    expect(() => deletePhotoFile('missing.jpg')).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run test/photoStorage.test.js`
Expected: FAIL - `../src/services/photoStorage.js` does not exist.

- [ ] **Step 3: Create `server/src/services/photoStorage.js`**

```js
import { randomUUID } from 'crypto';
import { mkdirSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = join(__dirname, '../../data/uploads');

export function saveUploadedPhoto(buffer) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
  const fileName = `${randomUUID()}.jpg`;
  writeFileSync(join(UPLOADS_DIR, fileName), buffer);
  return fileName;
}

export function deletePhotoFile(fileName) {
  const fullPath = join(UPLOADS_DIR, fileName);
  if (existsSync(fullPath)) unlinkSync(fullPath);
}

export function photoFilePath(fileName) {
  return join(UPLOADS_DIR, fileName);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 5: No commit.**

---

### Task 4: Event photo DB service

**Files:**
- Create: `server/src/services/eventPhotoService.js`
- Create: `server/test/eventPhotoService.test.js`

**Interfaces:**
- Consumes: `createDb` (Task 1's migrated schema with `event_photo` table).
- Produces: `createEventPhotoService(db)` returning `{ listByOwner(ownerType, ownerId), get(id), upsert({owner_type, owner_id, event_type, file_path, original_name}), remove(id) }`. Used by Task 5's routes.

- [ ] **Step 1: Write the failing test**

Create `server/test/eventPhotoService.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/db/connection.js';
import { createEventPhotoService } from '../src/services/eventPhotoService.js';

describe('eventPhotoService', () => {
  it('creates a photo record via upsert', () => {
    const db = createDb(':memory:');
    const service = createEventPhotoService(db);

    const photo = service.upsert({
      owner_type: 'person',
      owner_id: 1,
      event_type: 'birth',
      file_path: 'abc.jpg',
      original_name: 'scan.jpg',
    });

    expect(photo.id).toBeTypeOf('number');
    expect(service.listByOwner('person', 1)).toHaveLength(1);
  });

  it('upsert replaces the existing record for the same owner+event', () => {
    const db = createDb(':memory:');
    const service = createEventPhotoService(db);

    const first = service.upsert({
      owner_type: 'person',
      owner_id: 1,
      event_type: 'birth',
      file_path: 'first.jpg',
      original_name: 'first.jpg',
    });
    const second = service.upsert({
      owner_type: 'person',
      owner_id: 1,
      event_type: 'birth',
      file_path: 'second.jpg',
      original_name: 'second.jpg',
    });

    expect(second.id).toBe(first.id);
    expect(service.get(first.id).file_path).toBe('second.jpg');
    expect(service.listByOwner('person', 1)).toHaveLength(1);
  });

  it('removes a photo record', () => {
    const db = createDb(':memory:');
    const service = createEventPhotoService(db);
    const photo = service.upsert({
      owner_type: 'person',
      owner_id: 1,
      event_type: 'death',
      file_path: 'x.jpg',
      original_name: 'x.jpg',
    });

    service.remove(photo.id);
    expect(service.get(photo.id)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run test/eventPhotoService.test.js`
Expected: FAIL - `../src/services/eventPhotoService.js` does not exist.

- [ ] **Step 3: Create `server/src/services/eventPhotoService.js`**

```js
export function createEventPhotoService(db) {
  const selectByOwnerStmt = db.prepare('SELECT * FROM event_photo WHERE owner_type = ? AND owner_id = ?');
  const selectByKeyStmt = db.prepare(
    'SELECT * FROM event_photo WHERE owner_type = ? AND owner_id = ? AND event_type = ?'
  );
  const getStmt = db.prepare('SELECT * FROM event_photo WHERE id = ?');
  const insertStmt = db.prepare(`INSERT INTO event_photo (owner_type, owner_id, event_type, file_path, original_name)
    VALUES (@owner_type, @owner_id, @event_type, @file_path, @original_name)`);
  const updateStmt = db.prepare('UPDATE event_photo SET file_path = @file_path, original_name = @original_name WHERE id = @id');
  const deleteStmt = db.prepare('DELETE FROM event_photo WHERE id = ?');

  return {
    listByOwner(ownerType, ownerId) {
      return selectByOwnerStmt.all(ownerType, ownerId);
    },
    get(id) {
      return getStmt.get(id);
    },
    upsert({ owner_type, owner_id, event_type, file_path, original_name }) {
      const existing = selectByKeyStmt.get(owner_type, owner_id, event_type);
      if (existing) {
        updateStmt.run({ id: existing.id, file_path, original_name });
        return getStmt.get(existing.id);
      }
      const info = insertStmt.run({ owner_type, owner_id, event_type, file_path, original_name });
      return getStmt.get(info.lastInsertRowid);
    },
    remove(id) {
      deleteStmt.run(id);
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 5: No commit.**

---

### Task 5: Event photo routes

**Files:**
- Create: `server/src/routes/eventPhotos.js`
- Modify: `server/src/app.js`
- Create: `server/test/eventPhotos.test.js`

**Interfaces:**
- Consumes: `createEventPhotoService` (Task 4), `saveUploadedPhoto`/`deletePhotoFile`/`photoFilePath` (Task 3).
- Produces: `eventPhotosRouter(eventPhotoService)` mounted at `/api/event-photos` with `GET /` (query `owner_type`, `owner_id`), `POST /` (multipart `owner_type`, `owner_id`, `event_type`, `file`), `GET /:id/file`, `DELETE /:id`.

- [ ] **Step 1: Write the failing test**

Create `server/test/eventPhotos.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createDb } from '../src/db/connection.js';

describe('event photos API', () => {
  let app;

  beforeEach(() => {
    app = createApp(createDb(':memory:'));
  });

  async function createPerson() {
    const response = await request(app).post('/api/persons').send({ first_name: 'Jan' });
    return response.body.id;
  }

  it('uploads a jpeg photo for a birth event and serves it back', async () => {
    const personId = await createPerson();

    const uploadResponse = await request(app)
      .post('/api/event-photos')
      .field('owner_type', 'person')
      .field('owner_id', String(personId))
      .field('event_type', 'birth')
      .attach('file', Buffer.from('fake-jpeg-bytes'), { filename: 'birth.jpg', contentType: 'image/jpeg' });

    expect(uploadResponse.status).toBe(201);
    expect(uploadResponse.body.event_type).toBe('birth');
    expect(uploadResponse.body.url).toBe(`/api/event-photos/${uploadResponse.body.id}/file`);

    const fileResponse = await request(app).get(uploadResponse.body.url);
    expect(fileResponse.status).toBe(200);
  });

  it('rejects non-jpeg uploads', async () => {
    const personId = await createPerson();

    const response = await request(app)
      .post('/api/event-photos')
      .field('owner_type', 'person')
      .field('owner_id', String(personId))
      .field('event_type', 'birth')
      .attach('file', Buffer.from('not a photo'), { filename: 'note.txt', contentType: 'text/plain' });

    expect(response.status).toBe(400);
  });

  it('replaces an existing photo for the same event (upsert)', async () => {
    const personId = await createPerson();
    const first = await request(app)
      .post('/api/event-photos')
      .field('owner_type', 'person')
      .field('owner_id', String(personId))
      .field('event_type', 'death')
      .attach('file', Buffer.from('first-version'), { filename: 'a.jpg', contentType: 'image/jpeg' });

    const second = await request(app)
      .post('/api/event-photos')
      .field('owner_type', 'person')
      .field('owner_id', String(personId))
      .field('event_type', 'death')
      .attach('file', Buffer.from('second-version'), { filename: 'b.jpg', contentType: 'image/jpeg' });

    expect(second.body.id).toBe(first.body.id);
    const list = await request(app).get(`/api/event-photos?owner_type=person&owner_id=${personId}`);
    expect(list.body).toHaveLength(1);
  });

  it('deletes a photo', async () => {
    const personId = await createPerson();
    const uploaded = await request(app)
      .post('/api/event-photos')
      .field('owner_type', 'person')
      .field('owner_id', String(personId))
      .field('event_type', 'birth')
      .attach('file', Buffer.from('x'), { filename: 'a.jpg', contentType: 'image/jpeg' });

    const deleteResponse = await request(app).delete(`/api/event-photos/${uploaded.body.id}`);
    expect(deleteResponse.status).toBe(204);

    const fileResponse = await request(app).get(uploaded.body.url);
    expect(fileResponse.status).toBe(404);
  });
});
```

Note: if `fileResponse.body`/content checks behave unexpectedly for binary responses under supertest, adjust the assertion to what the actual response shape is (e.g. check `fileResponse.status` and `fileResponse.header['content-type']` instead of body content) - verify via the real test run rather than guessing, the same way Task 6 of the original plan adjusted its `read-gedcom` calls after running the suite.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run test/eventPhotos.test.js`
Expected: FAIL - no `/api/event-photos` route.

- [ ] **Step 3: Create `server/src/routes/eventPhotos.js`**

```js
import { Router } from 'express';
import multer from 'multer';
import { saveUploadedPhoto, deletePhotoFile, photoFilePath } from '../services/photoStorage.js';

const upload = multer({ storage: multer.memoryStorage() });

export function eventPhotosRouter(eventPhotoService) {
  const router = Router();

  router.get('/', (req, res) => {
    const { owner_type, owner_id } = req.query;
    const photos = eventPhotoService.listByOwner(owner_type, Number(owner_id)).map((photo) => ({
      ...photo,
      url: `/api/event-photos/${photo.id}/file`,
    }));
    res.json(photos);
  });

  router.post('/', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'file is required' });
    if (req.file.mimetype !== 'image/jpeg') {
      return res.status(400).json({ error: 'only image/jpeg files are allowed' });
    }
    const { owner_type, owner_id, event_type } = req.body;
    const existing = eventPhotoService
      .listByOwner(owner_type, Number(owner_id))
      .find((photo) => photo.event_type === event_type);
    if (existing) deletePhotoFile(existing.file_path);
    const fileName = saveUploadedPhoto(req.file.buffer);
    const photo = eventPhotoService.upsert({
      owner_type,
      owner_id: Number(owner_id),
      event_type,
      file_path: fileName,
      original_name: req.file.originalname,
    });
    res.status(201).json({ ...photo, url: `/api/event-photos/${photo.id}/file` });
  });

  router.get('/:id/file', (req, res) => {
    const photo = eventPhotoService.get(Number(req.params.id));
    if (!photo) return res.status(404).json({ error: 'not found' });
    res.sendFile(photoFilePath(photo.file_path));
  });

  router.delete('/:id', (req, res) => {
    const photo = eventPhotoService.get(Number(req.params.id));
    if (photo) deletePhotoFile(photo.file_path);
    eventPhotoService.remove(Number(req.params.id));
    res.status(204).end();
  });

  return router;
}
```

- [ ] **Step 4: Modify `server/src/app.js`**

Add imports near the top:

```js
import { createEventPhotoService } from './services/eventPhotoService.js';
import { eventPhotosRouter } from './routes/eventPhotos.js';
```

In `createApp`, after `const treeService = createTreeService(db);`, add:

```js
  const eventPhotoService = createEventPhotoService(db);
```

After the `/api/gedcom` mount, add:

```js
  app.use('/api/event-photos', eventPhotosRouter(eventPhotoService));
```

Do not reorder or remove any other route/middleware already in the file (including the static-serving block at the end).

- [ ] **Step 5: Run test to verify it passes**

Run: `cd server && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 6: No commit.**

---

### Task 6: Client API wrapper additions

**Files:**
- Modify: `client/src/api/client.js`
- Modify: `client/src/api/client.test.js`

**Interfaces:**
- Produces: `api.listEventPhotos(ownerType, ownerId)`, `api.uploadEventPhoto(formData)`, `api.deleteEventPhoto(id)`.

- [ ] **Step 1: Write the failing tests**

Append to `client/src/api/client.test.js` (inside the existing `describe('api client', ...)` block):

```js
  it('lists event photos for an owner', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ id: 1, event_type: 'birth', url: '/api/event-photos/1/file' }],
    });

    const photos = await api.listEventPhotos('person', 5);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/event-photos?owner_type=person&owner_id=5',
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } })
    );
    expect(photos).toEqual([{ id: 1, event_type: 'birth', url: '/api/event-photos/1/file' }]);
  });

  it('uploads an event photo as multipart form data', async () => {
    globalThis.fetch.mockResolvedValue({ ok: true, json: async () => ({ id: 1 }) });
    const formData = new FormData();

    const result = await api.uploadEventPhoto(formData);

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/event-photos', { method: 'POST', body: formData });
    expect(result).toEqual({ id: 1 });
  });

  it('deletes an event photo', async () => {
    globalThis.fetch.mockResolvedValue({ ok: true, status: 204, json: async () => ({}) });

    await api.deleteEventPhoto(7);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/event-photos/7',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd client && npx vitest run test/client.test.js` (actual path: `src/api/client.test.js`) - use `cd client && npx vitest run src/api/client.test.js`
Expected: FAIL - `api.listEventPhotos` etc. are not functions.

- [ ] **Step 3: Modify `client/src/api/client.js`**

Add these methods to the exported `api` object (after `getTree: () => request('/tree'),`):

```js
  listEventPhotos: (ownerType, ownerId) => request(`/event-photos?owner_type=${ownerType}&owner_id=${ownerId}`),
  uploadEventPhoto: async (formData) => {
    const response = await fetch(`${BASE_URL}/event-photos`, { method: 'POST', body: formData });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Request failed: ${response.status}`);
    }
    return response.json();
  },
  deleteEventPhoto: (id) => request(`/event-photos/${id}`, { method: 'DELETE' }),
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd client && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 5: No commit.**

---

### Task 7: `EventPhotoUpload` component

**Files:**
- Create: `client/src/components/EventPhotoUpload.vue`
- Create: `client/src/components/EventPhotoUpload.test.js`

**Interfaces:**
- Consumes: `api.uploadEventPhoto`, `api.deleteEventPhoto` (Task 6).
- Produces: `EventPhotoUpload` component, props `{ ownerType: String, ownerId: Number, eventType: String, label: String, photo: Object | null }` (`photo` shape: `{ id, url, ... }` or `null`), emits `changed()`. Used by Task 8's `PersonForm.vue`.

- [ ] **Step 1: Write the failing test**

Create `client/src/components/EventPhotoUpload.test.js`:

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import EventPhotoUpload from './EventPhotoUpload.vue';

describe('EventPhotoUpload', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows a file input when there is no photo yet', () => {
    const wrapper = mount(EventPhotoUpload, {
      props: { ownerType: 'person', ownerId: 1, eventType: 'birth', label: 'Zdjecie urodzenia', photo: null },
    });
    expect(wrapper.find('input[type="file"]').exists()).toBe(true);
  });

  it('uploads a file and emits changed', async () => {
    globalThis.fetch.mockResolvedValue({ ok: true, json: async () => ({ id: 1 }) });
    const wrapper = mount(EventPhotoUpload, {
      props: { ownerType: 'person', ownerId: 1, eventType: 'birth', label: 'Zdjecie urodzenia', photo: null },
    });
    const input = wrapper.find('input[type="file"]');
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    Object.defineProperty(input.element, 'files', { value: [file] });
    await input.trigger('change');
    await new Promise((resolve) => setTimeout(resolve));

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/event-photos', expect.objectContaining({ method: 'POST' }));
    expect(wrapper.emitted('changed')).toBeTruthy();
  });

  it('shows a thumbnail and remove button when a photo exists, and removes it', async () => {
    globalThis.fetch.mockResolvedValue({ ok: true, status: 204, json: async () => ({}) });
    const photo = { id: 7, url: '/api/event-photos/7/file' };
    const wrapper = mount(EventPhotoUpload, {
      props: { ownerType: 'person', ownerId: 1, eventType: 'death', label: 'Zdjecie zgonu', photo },
    });
    expect(wrapper.find('img').attributes('src')).toBe('/api/event-photos/7/file');

    await wrapper.find('button').trigger('click');
    await new Promise((resolve) => setTimeout(resolve));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/event-photos/7',
      expect.objectContaining({ method: 'DELETE' })
    );
    expect(wrapper.emitted('changed')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run`
Expected: FAIL - `./EventPhotoUpload.vue` does not exist.

- [ ] **Step 3: Create `client/src/components/EventPhotoUpload.vue`**

```vue
<script setup>
import { ref } from 'vue';
import { api } from '../api/client.js';

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
  uploading.value = true;
  error.value = '';
  try {
    const formData = new FormData();
    formData.append('owner_type', props.ownerType);
    formData.append('owner_id', String(props.ownerId));
    formData.append('event_type', props.eventType);
    formData.append('file', file);
    await api.uploadEventPhoto(formData);
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
    <span v-if="uploading" class="event-photo-status">Wysylanie...</span>
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

Run: `cd client && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 5: No commit.**

---

### Task 8: `PersonForm` - maiden name field + event photo integration

**Files:**
- Modify: `client/src/components/PersonForm.vue`
- Modify: `client/src/components/PersonForm.test.js`

**Interfaces:**
- Consumes: `api.listEventPhotos` (Task 6), `EventPhotoUpload` (Task 7).
- Produces: `PersonForm` now also emits `maiden_name` in its `save` payload, and (only when `props.person` has an `id`) renders two `EventPhotoUpload` instances for `event_type` `birth` and `death`.

- [ ] **Step 1: Write the failing tests**

Replace the entire contents of `client/src/components/PersonForm.test.js` with:

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import PersonForm from './PersonForm.vue';

describe('PersonForm', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

Run: `cd client && npx vitest run`
Expected: FAIL - no `maiden_name` input, no `EventPhotoUpload` usage yet, and the existing tests now hang/fail because `fetch` wasn't mocked before (this rewrite fixes that by adding the `beforeEach`).

- [ ] **Step 3: Replace the entire contents of `client/src/components/PersonForm.vue`**

```vue
<script setup>
import { reactive, ref, watch } from 'vue';
import { api } from '../api/client.js';
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

Run: `cd client && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 5: No commit.**

---

### Task 9: End-to-end smoke test (manual verification)

**Files:**
- No new files. Verification-only task.

- [ ] **Step 1: Run full server test suite**

Run: `cd server && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 2: Run full client test suite**

Run: `cd client && npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 3: Build the client**

Run: `cd client && npm run build`
Expected: no errors.

- [ ] **Step 4: Start the server and verify manually (or via a headless-browser script)**

- Create a person, confirm the "Nazwisko rodowe" field saves and round-trips (edit the person again, field still filled).
- Confirm the tree card shows `(z d. <maiden_name>)` under the name when set.
- Edit an existing person: upload a JPG under "Zdjecie aktu urodzenia" - confirm a thumbnail appears after upload.
- Upload a non-JPG file (e.g. a `.png` or `.txt` renamed to look like an image) - confirm it is rejected with an error message shown in the form, not a silent failure.
- Click "Usun zdjecie" - confirm the thumbnail disappears and the file input reappears.
- Re-upload a new photo for the same event - confirm it replaces the old one (only one thumbnail, old file gone from `server/data/uploads/`).

- [ ] **Step 5: No commit.** Report completion.
