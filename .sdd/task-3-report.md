# Task 3: Person CRUD API — Report

## Status: DONE

## Files touched
- Created: `server/test/persons.test.js`
- Created: `server/src/services/personService.js`
- Created: `server/src/routes/persons.js`
- Modified: `server/src/app.js` (createApp now accepts optional `db` param, mounts `/api/persons`)

## Process
1. Wrote `server/test/persons.test.js` as specified.
2. Ran `npx vitest run` — confirmed FAIL: 4 failed / 4 passed (8 total), because `createApp()` took no args and had no persons routes.
3. Created `server/src/services/personService.js` exactly as specified.
4. Created `server/src/routes/persons.js` exactly as specified.
5. Replaced `server/src/app.js` with the specified full content.
6. Ran `cd server && npx vitest run` again.

## Final test output
```
 RUN  v2.1.9 /Users/sara.czelusniak/workspace/nauka/genealogy-app/server

 ✓ test/connection.test.js (2 tests) 4ms
 ✓ test/app.test.js (1 test) 15ms
 ✓ test/persons.test.js (5 tests) 33ms

 Test Files  3 passed (3)
      Tests  8 passed (8)
```
All 8 tests pass (1 health + 2 connection + 5 persons), matching the expected count.

## Concerns
- None. No git operations were performed per instructions (project is not a git repo anyway).
