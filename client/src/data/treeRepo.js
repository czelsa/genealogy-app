export function createTreeRepo(db) {
  return {
    async getGraph() {
      const persons = await db.getAll('persons');
      const families = await db.getAll('families');
      return { persons, families };
    },
  };
}
