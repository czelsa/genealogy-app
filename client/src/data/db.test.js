import { describe, it, expect } from 'vitest';
import { openGenealogyDb } from './db.js';

describe('openGenealogyDb', () => {
  it('creates the three object stores', async () => {
    const db = await openGenealogyDb('test-db-1');
    expect(Array.from(db.objectStoreNames).sort()).toEqual(['eventPhotos', 'families', 'persons']);
    db.close();
  });

  it('autoincrements ids', async () => {
    const db = await openGenealogyDb('test-db-2');
    const id1 = await db.add('persons', { first_name: 'A' });
    const id2 = await db.add('persons', { first_name: 'B' });
    expect(id2).toBe(id1 + 1);
    db.close();
  });
});
