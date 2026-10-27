import { describe, it, expect } from 'vitest';
import { exportGedcom } from '../src/services/gedcomExport.js';

describe('exportGedcom', () => {
  it('writes individuals and families as GEDCOM lines', () => {
    const graph = {
      persons: [
        { id: 1, first_name: 'Jan', last_name: 'Kowalski', sex: 'M', birth_date: '1 JAN 1950', birth_place: 'Warszawa', death_date: null, death_place: null, notes: null },
        { id: 2, first_name: 'Anna', last_name: 'Nowak', sex: 'F', birth_date: null, birth_place: null, death_date: null, death_place: null, notes: null },
      ],
      families: [
        { id: 1, husband_id: 1, wife_id: 2, marriage_date: '1 JUN 1974', marriage_place: null, divorce_date: null, children: [] },
      ],
    };

    const text = exportGedcom(graph);

    expect(text).toContain('0 HEAD');
    expect(text).toContain('0 @I1@ INDI');
    expect(text).toContain('1 NAME Jan /Kowalski/');
    expect(text).toContain('1 SEX M');
    expect(text).toContain('2 DATE 1 JAN 1950');
    expect(text).toContain('0 @F1@ FAM');
    expect(text).toContain('1 HUSB @I1@');
    expect(text).toContain('1 WIFE @I2@');
    expect(text).toContain('0 TRLR');
  });
});
