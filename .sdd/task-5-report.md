# Task 5: Tree graph endpoint — Report

## Status
DONE — all tests pass.

## Files touched
- Created: `server/src/services/treeService.js`
- Created: `server/src/routes/tree.js`
- Modified: `server/src/app.js` (added treeService + mounted `/api/tree`)
- Created: `server/test/tree.test.js`

## Workflow
1. Wrote `server/test/tree.test.js` exactly as specified.
2. Ran `npx vitest run test/tree.test.js` — confirmed FAIL (404, route not mounted yet).
3. Created `treeService.js` and `tree.js` exactly as specified.
4. Modified `app.js`: added imports for `createTreeService` / `treeRouter`, instantiated `treeService` after `familyService`, mounted `app.use('/api/tree', treeRouter(treeService))` after the families mount.
5. Ran full suite: `cd server && npx vitest run`

## Test output (final full run)
```
 RUN  v2.1.9 /Users/sara.czelusniak/workspace/nauka/genealogy-app/server

 ✓ test/connection.test.js (2 tests) 4ms
 ✓ test/app.test.js (1 test) 15ms
 ✓ test/tree.test.js (1 test) 26ms
 ✓ test/families.test.js (3 tests) 32ms
 ✓ test/persons.test.js (5 tests) 34ms

 Test Files  5 passed (5)
      Tests  12 passed (12)
```
12 total tests (11 previous + 1 new), matching the expected count in the task spec.

## Concerns
None. Code was copied exactly as given in the task spec; no deviations needed. No git commands were run (per instruction — this project has no version control).
