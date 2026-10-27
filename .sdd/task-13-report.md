# Task 13: Family editor component

## Status
DONE

## Files touched
- Created: `client/src/components/FamilyEditor.test.js`
- Created: `client/src/components/FamilyEditor.vue`

## Test-first sequence
1. Wrote `FamilyEditor.test.js` per spec, ran `npx vitest run src/components/FamilyEditor.test.js`.
   - Confirmed FAIL: `Failed to resolve import "./FamilyEditor.vue" from "src/components/FamilyEditor.test.js". Does the file exist?`
2. Created `FamilyEditor.vue` exactly as given in the task spec (composition API `<script setup>`, props `persons`/`family`, emits `save-family`/`cancel`).
3. Ran `cd client && npx vitest run`:

```
 ✓ src/tree/layout.test.js (2 tests) 2ms
 ✓ src/api/client.test.js (2 tests) 3ms
 ✓ src/components/TreeView.test.js (2 tests) 15ms
 ✓ src/components/FamilyEditor.test.js (3 tests) 20ms
 ✓ src/components/PersonForm.test.js (3 tests) 21ms

 Test Files  5 passed (5)
      Tests  12 passed (12)
```

12/12 tests pass (9 previous + 3 new FamilyEditor tests), matching the expected count.

## Concerns
- None. Code copied verbatim from the task spec with no deviations.
- No git commands were run (project has no version control; task explicitly instructed to skip commit).
