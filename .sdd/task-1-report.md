# Task 1 Report: Server scaffold + health endpoint

## Status: DONE

## Files created
- `server/package.json`
- `server/.gitignore`
- `server/test/app.test.js`
- `server/src/app.js`
- `server/src/server.js`

## Steps performed
1. Created `server/package.json` exactly as specified.
2. Created `server/.gitignore` exactly as specified.
3. Ran `cd server && npm install` — succeeded, `node_modules` created, 135 packages added. 6 vulnerabilities reported by npm audit (3 moderate, 1 high, 2 critical) — not addressed, out of scope for this task.
4. Created `server/test/app.test.js` exactly as specified.
5. Ran `cd server && npx vitest run` before `app.js` existed — confirmed FAIL as expected:
   ```
   FAIL  test/app.test.js [ test/app.test.js ]
   Error: Failed to load url ../src/app.js (resolved id: ../src/app.js) in
   /Users/sara.czelusniak/workspace/nauka/genealogy-app/server/test/app.test.js. Does the file exist?
   Test Files  1 failed (1)
        Tests  no tests
   ```
6. Created `server/src/app.js` exactly as specified.
7. Created `server/src/server.js` exactly as specified.
8. Ran `cd server && npx vitest run` — PASS:
   ```
   ✓ test/app.test.js (1 test) 12ms

   Test Files  1 passed (1)
        Tests  1 passed (1)
   ```

## Exact test command and final output
Command: `cd /Users/sara.czelusniak/workspace/nauka/genealogy-app/server && npx vitest run`

Output:
```
 RUN  v2.1.9 /Users/sara.czelusniak/workspace/nauka/genealogy-app/server

 ✓ test/app.test.js (1 test) 12ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  17:24:41
   Duration  259ms (transform 12ms, setup 0ms, collect 66ms, tests 12ms, environment 0ms, prepare 33ms)
```

## Concerns
- `npm audit` reports 6 vulnerabilities (3 moderate, 1 high, 2 critical) in transitive dependencies of express/vitest/supertest. Not fixed since the task spec requires copying the dependency versions exactly as given; flagging for awareness only.
- No git operations were performed, per instructions (project intentionally has no version control).
