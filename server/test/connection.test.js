import { describe, it, expect } from 'vitest';
import { createDb } from '../src/db/connection.js';

describe('createDb', () => {
  it('creates the person table', () => {
    const db = createDb(':memory:');
    const info = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='person'").get();
    expect(info.name).toBe('person');
  });

  it('allows inserting and reading a person', () => {
    const db = createDb(':memory:');
    db.prepare('INSERT INTO person (first_name, last_name) VALUES (?, ?)').run('Jan', 'Kowalski');
    const row = db.prepare('SELECT * FROM person WHERE first_name = ?').get('Jan');
    expect(row.last_name).toBe('Kowalski');
    expect(row.sex).toBe('U');
  });
});
