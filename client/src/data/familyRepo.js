function normalize(data) {
  return {
    husband_id: data.husband_id ?? null,
    wife_id: data.wife_id ?? null,
    marriage_date: data.marriage_date ?? null,
    marriage_place: data.marriage_place ?? null,
    divorce_date: data.divorce_date ?? null,
  };
}

export function createFamilyRepo(db) {
  return {
    list() {
      return db.getAll('families');
    },
    get(id) {
      return db.get('families', id);
    },
    async create(data) {
      const id = await db.add('families', { ...normalize(data), children: [] });
      return db.get('families', id);
    },
    async update(id, data) {
      const existing = await db.get('families', id);
      await db.put('families', { ...existing, ...normalize(data), id });
      return db.get('families', id);
    },
    async remove(id) {
      await db.delete('families', id);
    },
    async addChild(familyId, childId, pedigree = 'birth') {
      const family = await db.get('families', familyId);
      const children = family.children.filter((child) => child.child_id !== childId);
      children.push({ child_id: childId, pedigree });
      await db.put('families', { ...family, children });
      return db.get('families', familyId);
    },
    async removeChild(familyId, childId) {
      const family = await db.get('families', familyId);
      const children = family.children.filter((child) => child.child_id !== childId);
      await db.put('families', { ...family, children });
      return db.get('families', familyId);
    },
  };
}
