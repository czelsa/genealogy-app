# Task 11: TreeView SVG component

## Status
DONE — all tests pass.

## Files touched
- Created: `client/src/components/TreeView.test.js`
- Created: `client/src/components/TreeView.vue`
- Created dir: `client/src/components/`

## Steps performed
1. Created the test file exactly as specified in the task.
2. Ran `npx vitest run src/components/TreeView.test.js` — confirmed FAIL (`TreeView.vue` did not exist, import resolution error).
3. Created `TreeView.vue` exactly as specified in the task (copied verbatim).
4. Ran `cd client && npx vitest run` — PASS, 6/6 tests total (3 test files: `layout.test.js` 2, `client.test.js` 2, `TreeView.test.js` 2).

## Test command + output (final run)
```
$ cd client && npx vitest run

 RUN  v2.1.9 /Users/sara.czelusniak/workspace/nauka/genealogy-app/client

 ✓ src/tree/layout.test.js (2 tests) 2ms
 ✓ src/api/client.test.js (2 tests) 3ms
 ✓ src/components/TreeView.test.js (2 tests) 15ms

 Test Files  3 passed (3)
      Tests  6 passed (6)
```

## Concerns
- None. Code was copied exactly as given in the task spec; no deviations.
- No git commands were run (per instruction — this project has no version control).
