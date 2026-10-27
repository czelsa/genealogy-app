import { readGedcom } from 'read-gedcom';

export function createGedcomRepo() {
  return {
    parseGedcomBuffer(buffer) {
      const str = new TextDecoder().decode(buffer);
      return readGedcom(str);
    },

    async importGedcomIntoRepos({ personRepo, familyRepo }, parsed) {
      let personsCreated = 0;
      let familiesCreated = 0;

      const indis = parsed.individuals || [];
      const personMap = new Map();

      for (const indi of indis) {
        const name = indi.getName();
        const parts = name ? name.valueAsParts() : {};
        const sex = indi.getSex ? indi.getSex() : null;
        const birt = indi.getEventBirth ? indi.getEventBirth() : null;
        const deat = indi.getEventDeath ? indi.getEventDeath() : null;

        const person = await personRepo.create({
          first_name: parts.givenName || null,
          last_name: parts.surname || null,
          sex: sex || 'U',
          birth_date: birt ? birt.getDate ? birt.getDate() : null : null,
          birth_place: birt ? birt.getPlace ? birt.getPlace() : null : null,
          death_date: deat ? deat.getDate ? deat.getDate() : null : null,
          death_place: deat ? deat.getPlace ? deat.getPlace() : null : null,
        });

        personMap.set(indi.id, person.id);
        personsCreated++;
      }

      const fams = parsed.families || [];
      for (const fam of fams) {
        const husb = fam.getHusband ? fam.getHusband() : null;
        const wife = fam.getWife ? fam.getWife() : null;
        const marr = fam.getEventMarriage ? fam.getEventMarriage() : null;

        const husband_id = husb ? personMap.get(husb.value ? husb.value() : husb) : null;
        const wife_id = wife ? personMap.get(wife.value ? wife.value() : wife) : null;

        await familyRepo.create({
          husband_id,
          wife_id,
          marriage_date: marr ? marr.getDate ? marr.getDate() : null : null,
          marriage_place: marr ? marr.getPlace ? marr.getPlace() : null : null,
        });

        familiesCreated++;
      }

      return { personsCreated, familiesCreated };
    },

    exportGedcom(graph) {
      const lines = ['0 HEAD', '1 GEDC', '2 VERS 5.5.1'];

      const { persons, families } = graph;

      persons.forEach((p, idx) => {
        const ediId = `I${idx + 1}`;
        lines.push(`0 @${ediId}@ INDI`);
        const fullName = [p.first_name, p.last_name].filter(Boolean).join(' ');
        if (fullName) {
          lines.push(`1 NAME ${p.first_name || ''} /${p.last_name || ''}/`);
        }
        if (p.sex) lines.push(`1 SEX ${p.sex}`);
        if (p.birth_date) {
          lines.push(`1 BIRT`);
          lines.push(`2 DATE ${p.birth_date}`);
          if (p.birth_place) lines.push(`2 PLAC ${p.birth_place}`);
        }
        if (p.death_date) {
          lines.push(`1 DEAT`);
          lines.push(`2 DATE ${p.death_date}`);
          if (p.death_place) lines.push(`2 PLAC ${p.death_place}`);
        }
      });

      families.forEach((f, idx) => {
        const famId = `F${idx + 1}`;
        lines.push(`0 @${famId}@ FAM`);
        if (f.husband_id) {
          const husbIdx = persons.findIndex((p) => p.id === f.husband_id);
          if (husbIdx >= 0) lines.push(`1 HUSB @I${husbIdx + 1}@`);
        }
        if (f.wife_id) {
          const wifeIdx = persons.findIndex((p) => p.id === f.wife_id);
          if (wifeIdx >= 0) lines.push(`1 WIFE @I${wifeIdx + 1}@`);
        }
      });

      lines.push('0 TRLR');
      return lines.join('\n');
    },

    downloadGedcomFile(gedcomStr) {
      const blob = new Blob([gedcomStr], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `genealogy-${new Date().toISOString().split('T')[0]}.ged`;
      link.click();
      URL.revokeObjectURL(url);
    },
  };
}
