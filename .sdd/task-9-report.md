# Task 9: Client scaffold + API wrapper

## Status: DONE

## Files touched

- Created `client/package.json`
- Created `client/.gitignore`
- Created `client/vite.config.js`
- Created `client/index.html`
- Created `client/src/main.js`
- Created `client/src/App.vue`
- Created `client/src/api/client.test.js`
- Created `client/src/api/client.js`

All files created exactly per the task spec, no deviations.

## Steps executed

1. Created package.json, .gitignore, vite.config.js, index.html, main.js, App.vue as specified.
2. Ran `npm install` in `client/` — succeeded, 139 packages added. Only deprecation warnings
   (`whatwg-encoding`) and `npm audit` vulnerability notices (3 moderate, 1 high, 2 critical) from
   transitive dependencies; no install errors.
3. Wrote the failing test `client/src/api/client.test.js` before `client.js` existed.
4. Ran `npx vitest run` — confirmed FAIL as expected:
   ```
   FAIL  src/api/client.test.js [ src/api/client.test.js ]
   Error: Failed to resolve import "./client.js" from "src/api/client.test.js".
   Test Files  1 failed (1)
   ```
5. Created `client/src/api/client.js` with the `api` object (`listPersons, getPerson,
   createPerson, updatePerson, deletePerson, listFamilies, getFamily, createFamily,
   updateFamily, addChild, getTree`), wrapping `fetch` against `/api`.
6. Re-ran `npx vitest run` — PASS:
   ```
   ✓ src/api/client.test.js (2 tests) 2ms

   Test Files  1 passed (1)
        Tests  2 passed (2)
   ```

## Test command + output

```
cd client && npx vitest run

 ✓ src/api/client.test.js (2 tests) 2ms

 Test Files  1 passed (1)
      Tests  2 passed (2)
```

## Concerns

- `npm audit` reports 6 vulnerabilities (3 moderate, 1 high, 2 critical) in transitive
  dependencies pulled in by vite/vitest/jsdom toolchain. Not addressed here since the task did not
  ask for it and `npm audit fix --force` could introduce breaking version changes; flagging for
  awareness.
- No git commands were run, per instructions (no version control in this project / explicit-ask
  policy).
- `client/src/App.vue` currently has no `<script>` block (not required by spec); it is a static
  placeholder heading only, consistent with Task 9's scope (scaffold only, no app logic yet).
