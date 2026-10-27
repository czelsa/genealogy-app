# Task 12: Person form component

## Status
DONE

## Files touched
- Created: `client/src/components/PersonForm.test.js`
- Created: `client/src/components/PersonForm.vue`

## Workflow
1. Wrote the test file first (copied exactly from the task spec).
2. Ran `npx vitest run src/components/PersonForm.test.js` — confirmed it failed, since `PersonForm.vue` did not exist yet (`Failed to resolve import "./PersonForm.vue"`).
3. Created `PersonForm.vue` (copied exactly from the task spec): a `<script setup>` component with a `person` prop, `save`/`cancel` emits, a reactive `form` object pre-filled via a `watch` on `props.person`, and a template with inputs for all person fields plus submit/cancel buttons.
4. Ran the full suite.

## Test command + output
```
cd client && npx vitest run
```
```
 RUN  v2.1.9 /Users/sara.czelusniak/workspace/nauka/genealogy-app/client

 ✓ src/tree/layout.test.js (2 tests) 2ms
 ✓ src/api/client.test.js (2 tests) 3ms
 ✓ src/components/TreeView.test.js (2 tests) 14ms
 ✓ src/components/PersonForm.test.js (3 tests) 18ms

 Test Files  4 passed (4)
      Tests  9 passed (9)
```
9/9 tests passing (6 previous + 3 new PersonForm tests), as expected.

## Concerns
- None. Code was copied exactly as given in the task spec; no deviations were needed.
- No git commands were run (project has no version control, per instructions).
