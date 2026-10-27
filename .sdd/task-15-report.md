# Task 15: Wire up App.vue — Report

## Status
DONE — all tests pass.

## Files touched
- Created: `client/src/App.test.js`
- Modified: `client/src/App.vue` (full rewrite, placeholder -> wired SPA shell)

## Steps performed
1. Wrote `client/src/App.test.js` exactly as specified in the task spec.
2. Ran `npx vitest run src/App.test.js` against the placeholder `App.vue` and confirmed both tests FAILED:
   - "loads the tree on mount and renders a person card" — failed because placeholder only rendered the heading.
   - "opens the person form when 'Nowa osoba' is clicked" — failed with `Cannot call trigger on an empty DOMWrapper` (no `data-action="new-person"` button existed).
3. Rewrote `client/src/App.vue` entirely with the exact content given in the task spec (script setup importing `api`, `TreeView`, `PersonForm`, `FamilyEditor`, `GedcomPanel`; `reload`, `openNewPerson`, `openEditPerson`, `savePerson`, `saveFamily` functions; template with header buttons `data-action="new-person"` / `data-action="new-family"`, `GedcomPanel`, `TreeView`, `PersonForm`, `FamilyEditor`).
4. Ran full suite: `npx vitest run`.

## Test command + output (final run)
```
$ npx vitest run

 ✓ src/tree/layout.test.js (2 tests) 2ms
 ✓ src/api/client.test.js (2 tests) 3ms
 ✓ src/components/TreeView.test.js (2 tests) 15ms
 ✓ src/components/GedcomPanel.test.js (1 test) 16ms
 ✓ src/components/PersonForm.test.js (3 tests) 20ms
 ✓ src/components/FamilyEditor.test.js (3 tests) 21ms
 ✓ src/App.test.js (2 tests) 22ms

 Test Files  7 passed (7)
      Tests  15 passed (15)
```

Matches expected: 15 total (13 previous + 2 new App tests).

## Concerns
- None blocking. `api.getTree()` exists in `client/src/api/client.js` (`getTree: () => request('/tree')`), confirmed it matches what `App.vue` calls.
- No git commands were run (per instruction — this project has no version control).
