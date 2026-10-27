import { describe, it, expect, beforeEach } from 'vitest';
import { openGenealogyDb } from './db.js';
import { createPersonRepo } from './personRepo.js';

describe('personRepo', () => {
  let repo;

  beforeEach(async () => {
    const db = await openGenealogyDb(`person-repo-${Math.random()}`);
    repo = createPersonRepo(db);
  });

  it('creates and fetches a person with maiden_name', async () => {
    const created = await repo.create({ first_name: 'Anna', last_name: 'Kowalska', maiden_name: 'Nowak', sex: 'F' });
    expect(created.id).toBeTypeOf('number');
    expect(created.maiden_name).toBe('Nowak');

    const fetched = await repo.get(created.id);
    expect(fetched.first_name).toBe('Anna');
  });

  it('defaults sex to U for invalid values', async () => {
    const created = await repo.create({ first_name: 'X', sex: 'invalid' });
    expect(created.sex).toBe('U');
  });

  it('updates a person', async () => {
    const created = await repo.create({ first_name: 'Jan' });
    const updated = await repo.update(created.id, { first_name: 'Janek', last_name: 'Kowalski' });
    expect(updated.first_name).toBe('Janek');
  });

  it('deletes a person', async () => {
    const created = await repo.create({ first_name: 'Ewa' });
    await repo.remove(created.id);
    expect(await repo.get(created.id)).toBeUndefined();
  });

  it('lists all persons', async () => {
    await repo.create({ first_name: 'A' });
    await repo.create({ first_name: 'B' });
    expect(await repo.list()).toHaveLength(2);
  });
});
