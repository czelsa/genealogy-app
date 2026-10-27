import { readGedcom } from 'read-gedcom';

function firstValue(selection) {
  const values = selection.value();
  return values.length > 0 ? values[0] : null;
}

function firstPointer(selection) {
  const pointers = selection.pointer();
  return pointers.length > 0 ? pointers[0] : null;
}

function normalizeSex(rawSex) {
  return rawSex === 'M' || rawSex === 'F' ? rawSex : 'U';
}

export function parseGedcomBuffer(arrayBuffer) {
  const gedcom = readGedcom(arrayBuffer);

  const persons = gedcom.getIndividualRecord().arraySelect().map((individual) => {
    const birth = individual.getEventBirth();
    const death = individual.getEventDeath();
    const nameParts = individual.getName().valueAsParts();
    const [given, surname] = nameParts.length > 0 ? nameParts[0] ?? [] : [];
    return {
      pointerId: firstPointer(individual),
      first_name: given ?? null,
      last_name: surname ?? null,
      sex: normalizeSex(firstValue(individual.getSex())),
      birth_date: firstValue(birth.getDate()),
      birth_place: firstValue(birth.getPlace()),
      death_date: firstValue(death.getDate()),
      death_place: firstValue(death.getPlace()),
      notes: individual.getNote().value().filter(Boolean).join('\n') || null,
    };
  });

  const families = gedcom.getFamilyRecord().arraySelect().map((family) => {
    const marriage = family.getEventMarriage();
    const divorce = family.getEventDivorce();
    return {
      pointerId: firstPointer(family),
      husbandPointerId: firstValue(family.getHusband()),
      wifePointerId: firstValue(family.getWife()),
      marriage_date: firstValue(marriage.getDate()),
      marriage_place: firstValue(marriage.getPlace()),
      divorce_date: firstValue(divorce.getDate()),
      childPointerIds: family.getChild().value().filter(Boolean),
    };
  });

  return { persons, families };
}

export function importGedcomIntoDb(db, arrayBuffer) {
  const { persons, families } = parseGedcomBuffer(arrayBuffer);

  const insertPerson = db.prepare(`INSERT INTO person
    (first_name, last_name, sex, birth_date, birth_place, death_date, death_place, notes)
    VALUES (@first_name, @last_name, @sex, @birth_date, @birth_place, @death_date, @death_place, @notes)`);
  const insertFamily = db.prepare(`INSERT INTO family
    (husband_id, wife_id, marriage_date, marriage_place, divorce_date)
    VALUES (@husband_id, @wife_id, @marriage_date, @marriage_place, @divorce_date)`);
  const insertChild = db.prepare(
    "INSERT INTO family_child (family_id, child_id, pedigree) VALUES (?, ?, 'birth')"
  );

  const run = db.transaction(() => {
    const idByPointer = new Map();
    for (const person of persons) {
      const info = insertPerson.run(person);
      idByPointer.set(person.pointerId, info.lastInsertRowid);
    }
    for (const family of families) {
      const info = insertFamily.run({
        husband_id: idByPointer.get(family.husbandPointerId) ?? null,
        wife_id: idByPointer.get(family.wifePointerId) ?? null,
        marriage_date: family.marriage_date,
        marriage_place: family.marriage_place,
        divorce_date: family.divorce_date,
      });
      for (const childPointer of family.childPointerIds) {
        const childId = idByPointer.get(childPointer);
        if (childId != null) insertChild.run(info.lastInsertRowid, childId);
      }
    }
    return { personCount: persons.length, familyCount: families.length };
  });

  return run();
}
