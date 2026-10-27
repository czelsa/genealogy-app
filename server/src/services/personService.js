function normalize(data) {
  return {
    first_name: data.first_name ?? null,
    last_name: data.last_name ?? null,
    sex: ['M', 'F'].includes(data.sex) ? data.sex : 'U',
    birth_date: data.birth_date ?? null,
    birth_place: data.birth_place ?? null,
    death_date: data.death_date ?? null,
    death_place: data.death_place ?? null,
    notes: data.notes ?? null,
  };
}

export function createPersonService(db) {
  const insertStmt = db.prepare(`INSERT INTO person
    (first_name, last_name, sex, birth_date, birth_place, death_date, death_place, notes)
    VALUES (@first_name, @last_name, @sex, @birth_date, @birth_place, @death_date, @death_place, @notes)`);
  const updateStmt = db.prepare(`UPDATE person SET
    first_name=@first_name, last_name=@last_name, sex=@sex,
    birth_date=@birth_date, birth_place=@birth_place,
    death_date=@death_date, death_place=@death_place, notes=@notes
    WHERE id=@id`);
  const deleteStmt = db.prepare('DELETE FROM person WHERE id = ?');
  const getStmt = db.prepare('SELECT * FROM person WHERE id = ?');
  const listStmt = db.prepare('SELECT * FROM person ORDER BY last_name, first_name');

  return {
    list() {
      return listStmt.all();
    },
    get(id) {
      return getStmt.get(id);
    },
    create(data) {
      const info = insertStmt.run(normalize(data));
      return getStmt.get(info.lastInsertRowid);
    },
    update(id, data) {
      updateStmt.run({ ...normalize(data), id });
      return getStmt.get(id);
    },
    remove(id) {
      deleteStmt.run(id);
    },
  };
}
