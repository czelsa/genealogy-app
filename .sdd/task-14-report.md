# Task 14: GEDCOM import/export panel

## Status
DONE — all tests pass.

## Files touched
- Created: `client/src/components/GedcomPanel.vue`
- Created: `client/src/components/GedcomPanel.test.js`

## Test command + output
Command: `cd client && npx vitest run`

```
 ✓ src/api/client.test.js (2 tests) 3ms
 ✓ src/tree/layout.test.js (2 tests) 2ms
 ✓ src/components/GedcomPanel.test.js (1 test) 15ms
 ✓ src/components/TreeView.test.js (2 tests) 15ms
 ✓ src/components/PersonForm.test.js (3 tests) 19ms
 ✓ src/components/FamilyEditor.test.js (3 tests) 21ms

 Test Files  6 passed (6)
      Tests  13 passed (13)
```

Confirmed failing first (file did not exist, import resolution error), then created `GedcomPanel.vue` exactly as specified in the task spec, then reran — all 13 tests pass (12 previous + 1 new).

## Concerns
None. Code copied exactly as given in the task spec. No git commands were run per instructions.
