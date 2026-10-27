import { describe, it, expect, beforeEach } from 'vitest';
import { openGenealogyDb } from './db.js';
import { createFamilyRepo } from './familyRepo.js';

describe('familyRepo', () => {
  let repo;

  beforeEach(async () => {
    const db = await openGenealogyDb(`family-repo-${Math.random()}`);
    repo = createFamilyRepo(db);
  });

  it('creates a family with an empty children array', async () => {
    const created = await repo.create({ husband_id: 1, wife_id: 2, marriage_date: '1 JAN 1980' });
    expect(created.husband_id).toBe(1);
    expect(created.children).toEqual([]);
  });

  it('adds a child to a family', async () => {
    const family = await repo.create({ husband_id: 1 });
    const updated = await repo.addChild(family.id, 42, 'birth');
    expect(updated.children).toEqual([{ child_id: 42, pedigree: 'birth' }]);
  });

  it('replaces the pedigree when adding the same child twice', async () => {
    const family = await repo.create({ husband_id: 1 });
    await repo.addChild(family.id, 42, 'birth');
    const updated = await repo.addChild(family.id, 42, 'adopted');
    expect(updated.children).toEqual([{ child_id: 42, pedigree: 'adopted' }]);
  });

  it('removes a child from a family', async () => {
    const family = await repo.create({ husband_id: 1 });
    await repo.addChild(family.id, 42, 'birth');
    const updated = await repo.removeChild(family.id, 42);
    expect(updated.children).toEqual([]);
  });

  it('updates family fields without losing children', async () => {
    const family = await repo.create({ husband_id: 1 });
    await repo.addChild(family.id, 42, 'birth');
    const updated = await repo.update(family.id, { husband_id: 1, marriage_date: '2 FEB 1981' });
    expect(updated.marriage_date).toBe('2 FEB 1981');
    expect(updated.children).toEqual([{ child_id: 42, pedigree: 'birth' }]);
  });
});
