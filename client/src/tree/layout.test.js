import { describe, it, expect } from 'vitest';
import { layoutTree } from './layout.js';

function person(id, firstName) {
  return { id, first_name: firstName, last_name: '', birth_date: null, death_date: null };
}

describe('layoutTree', () => {
  it('places parents above the root and children below', () => {
    const graph = {
      persons: [person(1, 'Dziadek'), person(2, 'Babcia'), person(3, 'Rodzic'), person(4, 'Dziecko')],
      families: [
        { id: 10, husband_id: 1, wife_id: 2, children: [{ child_id: 3, pedigree: 'birth' }] },
        { id: 11, husband_id: 3, wife_id: null, children: [{ child_id: 4, pedigree: 'birth' }] },
      ],
    };

    const { nodes, edges } = layoutTree(graph, 3);

    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    expect(byId[3].y).toBeLessThan(byId[4].y);
    expect(byId[1].y).toBeLessThan(byId[3].y);
    expect(byId[2].y).toBe(byId[1].y);

    const spouseEdge = edges.find((e) => e.type === 'spouse' && e.from.id === 1);
    expect(spouseEdge.to.id).toBe(2);

    const parentChildEdge = edges.find((e) => e.type === 'parent-child' && e.to.id === 4);
    expect(parentChildEdge.from.id).toBe(3);
  });

  it('returns only the root when it has no relations', () => {
    const graph = { persons: [person(1, 'Solo')], families: [] };
    const { nodes, edges } = layoutTree(graph, 1);
    expect(nodes).toHaveLength(1);
    expect(edges).toHaveLength(0);
  });
});
