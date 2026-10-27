import { Router } from 'express';

export function personsRouter(personService) {
  const router = Router();

  router.get('/', (req, res) => {
    res.json(personService.list());
  });

  router.get('/:id', (req, res) => {
    const person = personService.get(Number(req.params.id));
    if (!person) return res.status(404).json({ error: 'not found' });
    res.json(person);
  });

  router.post('/', (req, res) => {
    res.status(201).json(personService.create(req.body));
  });

  router.put('/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!personService.get(id)) return res.status(404).json({ error: 'not found' });
    res.json(personService.update(id, req.body));
  });

  router.delete('/:id', (req, res) => {
    personService.remove(Number(req.params.id));
    res.status(204).end();
  });

  return router;
}
