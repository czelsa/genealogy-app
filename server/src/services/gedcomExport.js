function escapeLine(value) {
  return String(value).replace(/[\r\n]+/g, ' ');
}

function formatIndividual(person, pointerFor) {
  const lines = [`0 ${pointerFor.person(person.id)} INDI`];
  lines.push(`1 NAME ${escapeLine(`${person.first_name ?? ''} /${person.last_name ?? ''}/`)}`);
  lines.push(`1 SEX ${person.sex ?? 'U'}`);
  if (person.birth_date || person.birth_place) {
    lines.push('1 BIRT');
    if (person.birth_date) lines.push(`2 DATE ${escapeLine(person.birth_date)}`);
    if (person.birth_place) lines.push(`2 PLAC ${escapeLine(person.birth_place)}`);
  }
  if (person.death_date || person.death_place) {
    lines.push('1 DEAT');
    if (person.death_date) lines.push(`2 DATE ${escapeLine(person.death_date)}`);
    if (person.death_place) lines.push(`2 PLAC ${escapeLine(person.death_place)}`);
  }
  if (person.notes) lines.push(`1 NOTE ${escapeLine(person.notes)}`);
  return lines;
}

function formatFamily(family, pointerFor) {
  const lines = [`0 ${pointerFor.family(family.id)} FAM`];
  if (family.husband_id) lines.push(`1 HUSB ${pointerFor.person(family.husband_id)}`);
  if (family.wife_id) lines.push(`1 WIFE ${pointerFor.person(family.wife_id)}`);
  for (const child of family.children) {
    lines.push(`1 CHIL ${pointerFor.person(child.child_id)}`);
  }
  if (family.marriage_date || family.marriage_place) {
    lines.push('1 MARR');
    if (family.marriage_date) lines.push(`2 DATE ${escapeLine(family.marriage_date)}`);
    if (family.marriage_place) lines.push(`2 PLAC ${escapeLine(family.marriage_place)}`);
  }
  if (family.divorce_date) {
    lines.push('1 DIV');
    lines.push(`2 DATE ${escapeLine(family.divorce_date)}`);
  }
  return lines;
}

export function exportGedcom(graph) {
  const pointerFor = {
    person: (id) => `@I${id}@`,
    family: (id) => `@F${id}@`,
  };

  const lines = [
    '0 HEAD',
    '1 SOUR genealogy-app',
    '1 GEDC',
    '2 VERS 5.5.1',
    '2 FORM LINEAGE-LINKED',
    '1 CHAR UTF-8',
  ];

  for (const person of graph.persons) {
    lines.push(...formatIndividual(person, pointerFor));
  }
  for (const family of graph.families) {
    lines.push(...formatFamily(family, pointerFor));
  }
  lines.push('0 TRLR');

  return lines.join('\n');
}
