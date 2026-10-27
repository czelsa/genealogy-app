import express from 'express';
import { createDb } from './db/connection.js';
import { createPersonService } from './services/personService.js';
import { personsRouter } from './routes/persons.js';
import { createFamilyService } from './services/familyService.js';
import { familiesRouter } from './routes/families.js';
import { createTreeService } from './services/treeService.js';
import { treeRouter } from './routes/tree.js';
import { gedcomRouter } from './routes/gedcom.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDistDir = join(__dirname, '../../client/dist');

export function createApp(db = createDb()) {
  const app = express();
  app.use(express.json());

  const personService = createPersonService(db);
  const familyService = createFamilyService(db);
  const treeService = createTreeService(db);

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/persons', personsRouter(personService));
  app.use('/api/families', familiesRouter(familyService));
  app.use('/api/tree', treeRouter(treeService));
  app.use('/api/gedcom', gedcomRouter(db, treeService));

  if (existsSync(clientDistDir)) {
    app.use(express.static(clientDistDir));
    app.get(/^(?!\/api).*/, (req, res) => {
      res.sendFile(join(clientDistDir, 'index.html'));
    });
  }

  return app;
}
