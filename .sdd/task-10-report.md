# Task 10: Tree layout algorithm

## Status
DONE — all tests passing.

## Files touched
- Created `client/src/tree/layout.test.js`
- Created `client/src/tree/layout.js`

## Test command + output

1. Confirmed failing before implementation:
```
$ cd client && npx vitest run src/tree/layout.test.js
FAIL  src/tree/layout.test.js [ src/tree/layout.test.js ]
Error: Failed to resolve import "./layout.js" from "src/tree/layout.test.js". Does the file exist?
Test Files  1 failed (1)
     Tests  no tests
```

2. After creating `layout.js`, full suite run:
```
$ cd client && npx vitest run
 ✓ src/tree/layout.test.js (2 tests) 2ms
 ✓ src/api/client.test.js (2 tests) 3ms

 Test Files  2 passed (2)
      Tests  4 passed (4)
```

4 total tests (2 previous + 2 new layout tests), all passing.

## Concerns
- None. Code copied exactly as given in the task spec (no deviations, no comments added).
- No git commands were run per instructions; nothing was committed.
