const COLUMN_WIDTH = 260;
const ROW_HEIGHT = 170;

function findParentFamily(graph, personId) {
  return graph.families.find((family) =>
    family.children.some((child) => child.child_id === personId)
  );
}

function findSpouseFamilies(graph, personId) {
  return graph.families.filter(
    (family) => family.husband_id === personId || family.wife_id === personId
  );
}

function spouseOf(family, personId) {
  if (family.husband_id === personId) return family.wife_id;
  if (family.wife_id === personId) return family.husband_id;
  return null;
}

export function layoutTree(graph, rootId) {
  const personsById = new Map(graph.persons.map((p) => [p.id, p]));
  const generation = new Map([[rootId, 0]]);
  const visited = new Set();
  const queue = [[rootId, 0]];

  while (queue.length > 0) {
    const [personId, gen] = queue.shift();
    if (visited.has(personId)) continue;
    visited.add(personId);

    const parentFamily = findParentFamily(graph, personId);
    if (parentFamily) {
      for (const parentId of [parentFamily.husband_id, parentFamily.wife_id]) {
        if (parentId != null && !generation.has(parentId)) {
          generation.set(parentId, gen - 1);
          queue.push([parentId, gen - 1]);
        }
      }
    }

    for (const family of findSpouseFamilies(graph, personId)) {
      const spouseId = spouseOf(family, personId);
      if (spouseId != null && !generation.has(spouseId)) {
        generation.set(spouseId, gen);
        queue.push([spouseId, gen]);
      }
      for (const child of family.children) {
        if (!generation.has(child.child_id)) {
          generation.set(child.child_id, gen + 1);
          queue.push([child.child_id, gen + 1]);
        }
      }
    }
  }

  const rows = new Map();
  for (const [personId, gen] of generation.entries()) {
    if (!rows.has(gen)) rows.set(gen, []);
    rows.get(gen).push(personId);
  }

  const minGen = Math.min(...rows.keys());
  const nodes = [];
  for (const [gen, personIds] of rows.entries()) {
    personIds.forEach((personId, index) => {
      nodes.push({
        id: personId,
        person: personsById.get(personId),
        x: index * COLUMN_WIDTH,
        y: (gen - minGen) * ROW_HEIGHT,
      });
    });
  }

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const edges = [];
  for (const family of graph.families) {
    const husband = nodeById.get(family.husband_id);
    const wife = nodeById.get(family.wife_id);
    if (husband && wife) {
      edges.push({ type: 'spouse', from: husband, to: wife });
    }
    const parentNode = husband ?? wife;
    if (parentNode) {
      for (const child of family.children) {
        const childNode = nodeById.get(child.child_id);
        if (childNode) edges.push({ type: 'parent-child', from: parentNode, to: childNode });
      }
    }
  }

  return { nodes, edges };
}
