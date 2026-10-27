# Task 2: SQLite schema and connection module — Report

## Status: DONE

All 3 tests pass (1 from Task 1 + 2 new). No git commands were run (per instructions, this project has no version control).

## Files touched

- Modified: `server/package.json` — added `"better-sqlite3": "^11.3.0"` to `dependencies`.
- Created: `server/src/db/schema.sql` — `person`, `family`, `family_child` tables, copied exactly from spec.
- Created: `server/src/db/connection.js` — exports `createDb(path?)`, applies schema, defaults to `server/data/genealogy.db`, creates parent dir via `mkdirSync` unless path is `':memory:'`.
- Created: `server/test/connection.test.js` — two tests: table creation check, insert/read round-trip.

## Commands run

1. `cd server && npm install` — succeeded, added 35 packages (better-sqlite3 + native deps). npm reported 6 vulnerabilities (3 moderate, 1 high, 2 critical) via `npm audit` in transitive deps; not addressed, flagging as a concern below.
2. `npx vitest run test/connection.test.js` (before creating connection.js) — confirmed FAIL as expected:
   ```
   FAIL  test/connection.test.js [ test/connection.test.js ]
   Error: Failed to load url ../src/db/connection.js ... Does the file exist?
   Test Files  1 failed (1)
   ```
3. `npx vitest run` (full suite, after creating connection.js) — PASS:
   ```
    ✓ test/connection.test.js (2 tests) 5ms
    ✓ test/app.test.js (1 test) 12ms

    Test Files  2 passed (2)
         Tests  3 passed (3)
   ```

## Concerns

- `npm install` surfaced 6 vulnerabilities (3 moderate, 1 high, 2 critical) in the dependency tree per npm's audit summary; not investigated or fixed since it was out of scope for this task. Worth a `npm audit` review later.
- `server/data/` directory (for the default non-memory DB path) was not created/tested in this task since all tests use `':memory:'`; `mkdirSync` path is implemented per spec but unexercised.
