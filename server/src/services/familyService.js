function normalize(data) {
  return {
    husband_id: data.husband_id ?? null,
    wife_id: data.wife_id ?? null,
    marriage_date: data.marriage_date ?? null,
    marriage_place: data.marriage_place ?? null,
    divorce_date: data.divorce_date ?? null,
  };
}

export function createFamilyService(db) {
  const insertStmt = db.prepare(`INSERT INTO family
    (husband_id, wife_id, marriage_date, marriage_place, divorce_date)
    VALUES (@husband_id, @wife_id, @marriage_date, @marriage_place, @divorce_date)`);
  const updateStmt = db.prepare(`UPDATE family SET
    husband_id=@husband_id, wife_id=@wife_id, marriage_date=@marriage_date,
    marriage_place=@marriage_place, divorce_date=@divorce_date
    WHERE id=@id`);
  const deleteStmt = db.prepare('DELETE FROM family WHERE id = ?');
  const deleteChildrenStmt = db.prepare('DELETE FROM family_child WHERE family_id = ?');
  const getStmt = db.prepare('SELECT * FROM family WHERE id = ?');
  const listStmt = db.prepare('SELECT * FROM family');
  const addChildStmt = db.prepare(
    'INSERT OR REPLACE INTO family_child (family_id, child_id, pedigree) VALUES (?, ?, ?)'
  );
  const childrenStmt = db.prepare('SELECT child_id, pedigree FROM family_child WHERE family_id = ?');
  const removeChildStmt = db.prepare('DELETE FROM family_child WHERE family_id = ? AND child_id = ?');

  function withChildren(family) {
    if (!family) return undefined;
    return { ...family, children: childrenStmt.all(family.id) };
  }

  return {
    list() {
      return listStmt.all().map(withChildren);
    },
    get(id) {
      return withChildren(getStmt.get(id));
    },
    create(data) {
      const info = insertStmt.run(normalize(data));
      return withChildren(getStmt.get(info.lastInsertRowid));
    },
    update(id, data) {
      updateStmt.run({ ...normalize(data), id });
      return withChildren(getStmt.get(id));
    },
    remove(id) {
      deleteChildrenStmt.run(id);
      deleteStmt.run(id);
    },
    addChild(familyId, childId, pedigree = 'birth') {
      addChildStmt.run(familyId, childId, pedigree);
      return withChildren(getStmt.get(familyId));
    },
    removeChild(familyId, childId) {
      removeChildStmt.run(familyId, childId);
      return withChildren(getStmt.get(familyId));
    },
  };
}
