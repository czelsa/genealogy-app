# Task 7: GEDCOM export — Report

## Status
DONE — all tests pass (15/15).

## Files touched
- Created: `server/src/services/gedcomExport.js` — `exportGedcom(graph)` builds GEDCOM text (HEAD, INDI records, FAM records, TRLR) exactly per spec.
- Modified: `server/src/routes/gedcom.js` — `gedcomRouter(db, treeService)` now also accepts `treeService`; added `GET /export` returning GEDCOM text with `Content-Type: text/plain; charset=utf-8` and `Content-Disposition: attachment; filename="export.ged"`.
- Modified: `server/src/app.js` — mount line updated to `gedcomRouter(db, treeService)`.
- Created: `server/test/gedcomExport.test.js` — failing test written first, confirmed FAIL (module not found), then confirmed PASS after implementation.

## Test command + output
```
cd server && npx vitest run
```
```
 ✓ test/gedcomExport.test.js (1 test)
 ✓ test/connection.test.js (2 tests)
 ✓ test/gedcomImport.test.js (2 tests)
 ✓ test/app.test.js (1 test)
 ✓ test/tree.test.js (1 test)
 ✓ test/families.test.js (3 tests)
 ✓ test/persons.test.js (5 tests)

 Test Files  7 passed (7)
      Tests  15 passed (15)
```

## Concerns
- None. Implementation and test file match the task spec verbatim.
- No git commands were run, per instructions (project has no VCS).
