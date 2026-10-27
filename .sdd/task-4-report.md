# Task 4: Family CRUD API + children

## Status
DONE — all tests pass (11/11).

## Files touched
- Created: `server/src/services/familyService.js`
- Created: `server/src/routes/families.js`
- Modified: `server/src/app.js` (added `createFamilyService`/`familiesRouter` imports, service instantiation, and `/api/families` mount; existing `/api/persons` mount untouched)
- Created: `server/test/families.test.js`

## Process
1. Wrote `server/test/families.test.js` exactly per spec.
2. Ran `npx vitest run test/families.test.js` — confirmed FAIL (2 of 3 tests failing with 404, since `/api/families` route didn't exist yet).
3. Created `familyService.js` and `families.js` exactly per spec.
4. Modified `app.js` to wire up the new service/router.
5. Ran `cd server && npx vitest run` — all 11 tests passed (8 previous + 3 new families tests).

## Test command + output
```
$ npx vitest run
 ✓ test/connection.test.js (2 tests) 4ms
 ✓ test/app.test.js (1 test) 15ms
 ✓ test/families.test.js (3 tests) 31ms
 ✓ test/persons.test.js (5 tests) 33ms

 Test Files  4 passed (4)
      Tests  11 passed (11)
```

## Concerns
- None. Code was copied exactly as given in the task spec; no deviations were needed.
- No git commands were run per instructions (project has no version control).
