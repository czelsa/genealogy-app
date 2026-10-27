# Task 8 Report: Serve client build from Express

## Status
DONE — all 17 tests pass (15 previous + 2 new).

## Files touched
- Modified: `server/src/app.js`
- Created: `server/test/staticServing.test.js`

## Changes

### server/test/staticServing.test.js (new)
Test file written exactly as specified in the task. Creates a temporary
`client/dist/index.html` before the tests run and removes it in `afterAll`.
Verifies:
1. A non-`/api` route returns 200 and serves the dist `index.html` content.
2. `/api/health` still responds correctly (API routes are not shadowed).

### server/src/app.js
Added imports and a `clientDistDir` constant after the existing imports:

```js
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDistDir = join(__dirname, '../../client/dist');
```

Added at the end of `createApp`, right before `return app;`:

```js
  if (existsSync(clientDistDir)) {
    app.use(express.static(clientDistDir));
    app.get(/^(?!\/api).*/, (req, res) => {
      res.sendFile(join(clientDistDir, 'index.html'));
    });
  }
```

No other part of `app.js` was touched — existing imports, routes, and mounts
are unchanged.

## Test command + output

Ran the failing test first to confirm it failed before the implementation change:

```
$ npx vitest run test/staticServing.test.js
 ❯ test/staticServing.test.js (2 tests | 1 failed)
   × serves index.html for a non-api route
     AssertionError: expected 404 to be 200
```

After implementing the app.js change, ran the full suite:

```
$ npx vitest run
 ✓ test/gedcomExport.test.js (1 test)
 ✓ test/connection.test.js (2 tests)
 ✓ test/gedcomImport.test.js (2 tests)
 ✓ test/app.test.js (1 test)
 ✓ test/staticServing.test.js (2 tests)
 ✓ test/tree.test.js (1 test)
 ✓ test/families.test.js (3 tests)
 ✓ test/persons.test.js (5 tests)

 Test Files  8 passed (8)
      Tests  17 passed (17)
```

## Concerns
- None. `client/dist` does not exist in the repo yet (client isn't built), so
  the static-serving middleware is not registered during normal test runs
  outside of `staticServing.test.js`, which creates/removes the directory
  itself. This matches the task's expected behavior.
- No git commands were run, per instructions — work is left uncommitted.
