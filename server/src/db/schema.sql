CREATE TABLE IF NOT EXISTS person (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT,
  last_name TEXT,
  sex TEXT CHECK(sex IN ('M','F','U')) NOT NULL DEFAULT 'U',
  birth_date TEXT,
  birth_place TEXT,
  death_date TEXT,
  death_place TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS family (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  husband_id INTEGER REFERENCES person(id),
  wife_id INTEGER REFERENCES person(id),
  marriage_date TEXT,
  marriage_place TEXT,
  divorce_date TEXT
);

CREATE TABLE IF NOT EXISTS family_child (
  family_id INTEGER NOT NULL REFERENCES family(id),
  child_id INTEGER NOT NULL REFERENCES person(id),
  pedigree TEXT CHECK(pedigree IN ('birth','adopted','foster')) NOT NULL DEFAULT 'birth',
  PRIMARY KEY (family_id, child_id)
);
