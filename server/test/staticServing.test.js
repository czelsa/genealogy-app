import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createApp } from '../src/app.js';
import { createDb } from '../src/db/connection.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '../../client/dist');

mkdirSync(distDir, { recursive: true });
writeFileSync(join(distDir, 'index.html'), '<html><body>genealogy</body></html>');

afterAll(() => {
  rmSync(distDir, { recursive: true, force: true });
});

describe('static client serving', () => {
  it('serves index.html for a non-api route', async () => {
    const app = createApp(createDb(':memory:'));
    const response = await request(app).get('/some/client/route');
    expect(response.status).toBe(200);
    expect(response.text).toContain('genealogy');
  });

  it('still serves the api', async () => {
    const app = createApp(createDb(':memory:'));
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
  });
});
