import { Router } from 'express';
import multer from 'multer';
import { importGedcomIntoDb } from '../services/gedcomImport.js';
import { exportGedcom } from '../services/gedcomExport.js';

const upload = multer({ storage: multer.memoryStorage() });

export function gedcomRouter(db, treeService) {
  const router = Router();

  router.post('/import', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'file is required' });
    try {
      const buffer = req.file.buffer;
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      const result = importGedcomIntoDb(db, arrayBuffer);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get('/export', (req, res) => {
    const graph = treeService.getGraph();
    const gedcomText = exportGedcom(graph);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="export.ged"');
    res.send(gedcomText);
  });

  return router;
}
