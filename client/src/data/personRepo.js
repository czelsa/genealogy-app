function normalize(data) {
  return {
    first_name: data.first_name ?? null,
    last_name: data.last_name ?? null,
    maiden_name: data.maiden_name ?? null,
    sex: ['M', 'F'].includes(data.sex) ? data.sex : 'U',
    birth_date: data.birth_date ?? null,
    birth_place: data.birth_place ?? null,
    death_date: data.death_date ?? null,
    death_place: data.death_place ?? null,
    notes: data.notes ?? null,
  };
}

export function createPersonRepo(db) {
  return {
    list() {
      return db.getAll('persons');
    },
    get(id) {
      return db.get('persons', id);
    },
    async create(data) {
      const id = await db.add('persons', normalize(data));
      return db.get('persons', id);
    },
    async update(id, data) {
      await db.put('persons', { ...normalize(data), id });
      return db.get('persons', id);
    },
    async remove(id) {
      await db.delete('persons', id);
    },
  };
}
