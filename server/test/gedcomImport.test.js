import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createDb } from '../src/db/connection.js';
import { parseGedcomBuffer, importGedcomIntoDb } from '../src/services/gedcomImport.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadFixtureArrayBuffer() {
  const buffer = readFileSync(join(__dirname, 'fixtures/sample.ged'));
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

describe('parseGedcomBuffer', () => {
  it('parses individuals and families', () => {
    const { persons, families } = parseGedcomBuffer(loadFixtureArrayBuffer());

    expect(persons).toHaveLength(3);
    const jan = persons.find((p) => p.pointerId === '@I1@');
    expect(jan.first_name).toBe('Jan');
    expect(jan.last_name).toBe('Kowalski');
    expect(jan.sex).toBe('M');
    expect(jan.birth_date).toBe('1 JAN 1950');
    expect(jan.birth_place).toBe('Warszawa');

    expect(families).toHaveLength(1);
    expect(families[0].husbandPointerId).toBe('@I1@');
    expect(families[0].wifePointerId).toBe('@I2@');
    expect(families[0].childPointerIds).toEqual(['@I3@']);
    expect(families[0].marriage_date).toBe('1 JUN 1974');
  });
});

describe('importGedcomIntoDb', () => {
  it('inserts persons and families transactionally', () => {
    const db = createDb(':memory:');
    const result = importGedcomIntoDb(db, loadFixtureArrayBuffer());

    expect(result).toEqual({ personCount: 3, familyCount: 1 });

    const persons = db.prepare('SELECT * FROM person').all();
    expect(persons).toHaveLength(3);

    const families = db.prepare('SELECT * FROM family').all();
    expect(families).toHaveLength(1);

    const children = db.prepare('SELECT * FROM family_child').all();
    expect(children).toHaveLength(1);
  });
});
