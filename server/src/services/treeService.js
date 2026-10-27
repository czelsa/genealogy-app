export function createTreeService(db) {
  const personsStmt = db.prepare('SELECT * FROM person');
  const familiesStmt = db.prepare('SELECT * FROM family');
  const childLinksStmt = db.prepare('SELECT family_id, child_id, pedigree FROM family_child');

  return {
    getGraph() {
      const persons = personsStmt.all();
      const families = familiesStmt.all();
      const childLinks = childLinksStmt.all();
      const familiesWithChildren = families.map((family) => ({
        ...family,
        children: childLinks
          .filter((link) => link.family_id === family.id)
          .map((link) => ({ child_id: link.child_id, pedigree: link.pedigree })),
      }));
      return { persons, families: familiesWithChildren };
    },
  };
}
