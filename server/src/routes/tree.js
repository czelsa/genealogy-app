import { Router } from 'express';

export function treeRouter(treeService) {
  const router = Router();

  router.get('/', (req, res) => {
    res.json(treeService.getGraph());
  });

  return router;
}
