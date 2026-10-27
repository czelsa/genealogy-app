import { describe, it, expect, beforeEach } from 'vitest';
import api from './index.js';

describe('api facade', () => {
  beforeEach(async () => {
    // API initializes its repos on first call
  });

  it('creates, lists, and retrieves persons', async () => {
    const created = await api.createPerson({ first_name: 'Alice', last_name: 'Smith' });
    expect(created.id).toBeDefined();
    expect(created.first_name).toBe('Alice');

    const retrieved = await api.getPerson(created.id);
    expect(retrieved.first_name).toBe('Alice');

    const list = await api.listPersons();
    expect(list.length).toBeGreaterThan(0);
  });

  it('updates a person', async () => {
    const person = await api.createPerson({ first_name: 'Bob' });
    const updated = await api.updatePerson(person.id, {
      first_name: 'Robert',
      last_name: 'Johnson',
    });
    expect(updated.first_name).toBe('Robert');
  });

  it('deletes a person', async () => {
    const person = await api.createPerson({ first_name: 'Charlie' });
    await api.deletePerson(person.id);
    const retrieved = await api.getPerson(person.id);
    expect(retrieved).toBeUndefined();
  });

  it('creates and manages families', async () => {
    const p1 = await api.createPerson({ first_name: 'John', sex: 'M' });
    const p2 = await api.createPerson({ first_name: 'Jane', sex: 'F' });

    const family = await api.createFamily({ husband_id: p1.id, wife_id: p2.id });
    expect(family.id).toBeDefined();

    const retrieved = await api.getFamily(family.id);
    expect(retrieved.husband_id).toBe(p1.id);
  });

  it('adds and removes children from family', async () => {
    const parent = await api.createPerson({ first_name: 'Parent' });
    const child = await api.createPerson({ first_name: 'Child' });
    const family = await api.createFamily({ husband_id: parent.id });

    const updated = await api.addChild(family.id, child.id, 'birth');
    expect(updated.children).toHaveLength(1);

    const removed = await api.removeChild(family.id, child.id);
    expect(removed.children).toHaveLength(0);
  });

  it('exports GEDCOM', async () => {
    await api.createPerson({ first_name: 'Test', sex: 'M' });
    const gedcomStr = await api.exportGedcomFile();
    expect(gedcomStr).toContain('HEAD');
    expect(gedcomStr).toContain('TRLR');
  });

  it('gets tree graph', async () => {
    await api.createPerson({ first_name: 'GraphTest' });
    const graph = await api.getTree();
    expect(graph.persons).toBeDefined();
    expect(graph.families).toBeDefined();
  });
});
