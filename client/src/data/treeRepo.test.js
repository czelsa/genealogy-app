import { describe, it, expect, beforeEach } from 'vitest';
import { openGenealogyDb } from './db.js';
import { createPersonRepo } from './personRepo.js';
import { createFamilyRepo } from './familyRepo.js';
import { createTreeRepo } from './treeRepo.js';

describe('treeRepo', () => {
  let personRepo;
  let familyRepo;
  let treeRepo;

  beforeEach(async () => {
    const db = await openGenealogyDb(`tree-repo-${Math.random()}`);
    personRepo = createPersonRepo(db);
    familyRepo = createFamilyRepo(db);
    treeRepo = createTreeRepo(db);
  });

  it('returns empty graph when no data', async () => {
    const graph = await treeRepo.getGraph();
    expect(graph.persons).toEqual([]);
    expect(graph.families).toEqual([]);
  });

  it('returns all persons and families in graph', async () => {
    const p1 = await personRepo.create({ first_name: 'Alice' });
    const p2 = await personRepo.create({ first_name: 'Bob' });
    const fam = await familyRepo.create({ husband_id: p1.id, wife_id: p2.id });

    const graph = await treeRepo.getGraph();
    expect(graph.persons).toHaveLength(2);
    expect(graph.families).toHaveLength(1);
    expect(graph.persons[0].first_name).toBe('Alice');
    expect(graph.families[0].husband_id).toBe(p1.id);
  });
});
