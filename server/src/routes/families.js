import { Router } from 'express';

export function familiesRouter(familyService) {
  const router = Router();

  router.get('/', (req, res) => {
    res.json(familyService.list());
  });

  router.get('/:id', (req, res) => {
    const family = familyService.get(Number(req.params.id));
    if (!family) return res.status(404).json({ error: 'not found' });
    res.json(family);
  });

  router.post('/', (req, res) => {
    res.status(201).json(familyService.create(req.body));
  });

  router.put('/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!familyService.get(id)) return res.status(404).json({ error: 'not found' });
    res.json(familyService.update(id, req.body));
  });

  router.delete('/:id', (req, res) => {
    familyService.remove(Number(req.params.id));
    res.status(204).end();
  });

  router.post('/:id/children', (req, res) => {
    const id = Number(req.params.id);
    if (!familyService.get(id)) return res.status(404).json({ error: 'not found' });
    res.status(201).json(familyService.addChild(id, Number(req.body.child_id), req.body.pedigree));
  });

  router.delete('/:id/children/:childId', (req, res) => {
    res.json(familyService.removeChild(Number(req.params.id), Number(req.params.childId)));
  });

  return router;
}
