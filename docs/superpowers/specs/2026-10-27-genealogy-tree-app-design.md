# Genealogy Tree App - Design

## Cel

Aplikacja webowa do recznego tworzenia drzew genealogicznych (formularz), przechowywania osob i relacji (data ur./smierci, miejsca, notatki), wizualizacji drzewa, oraz importu/eksportu plikow GEDCOM.

## Zakres

- Jeden uzytkownik, bez logowania/auth.
- Pelny parser GEDCOM 5.5.1/7 (przez gotowa biblioteke npm) + wlasny eksporter GEDCOM pokrywajacy uzywane tagi.
- Klasyczne hierarchiczne drzewo (SVG) z kartami osob.

## Architektura

Monorepo:
- `server/` - Node + Express, SQLite przez `better-sqlite3` (raw SQL, migracje jako ponumerowane pliki .sql, bez ORM).
- `client/` - Vue 3 SPA (Vite), konsumuje REST API.

Produkcyjnie: `vite build` do `client/dist`, Express serwuje te pliki statycznie + API pod `/api/*`. Jeden proces, jeden port.

## Model danych

```sql
Person(
  id, first_name, last_name, sex, -- 'M' | 'F' | 'U'
  birth_date, birth_place,
  death_date, death_place,
  notes
)

Family(
  id, husband_id -> Person.id NULL, wife_id -> Person.id NULL,
  marriage_date, marriage_place, divorce_date
)

FamilyChild(
  family_id -> Family.id, child_id -> Person.id,
  pedigree -- 'birth' | 'adopted' | 'foster'
)
```

Daty przechowywane jako tekst w formacie GEDCOM-podobnym (np. "12 MAR 1950", lub czesciowe "1950", "MAR 1950"), zeby bez strat mapowac na/z GEDCOM. `husband_id`/`wife_id` to etykiety pozycji w rekordzie FAM (zgodnie z GEDCOM), nie wymuszaja plci - obsluguja pary jednoplciowe.

## API

- `GET/POST/PUT/DELETE /api/persons`, `/api/persons/:id`
- `GET/POST/PUT/DELETE /api/families`, `/api/families/:id`
- `POST /api/families/:id/children` - dodanie dziecka do rodziny
- `GET /api/tree?root=:personId` - zwraca graf (persons + families) do renderowania drzewa
- `POST /api/gedcom/import` (multipart .ged upload) - parsuje plik (biblioteka npm, np. `read-gedcom`), mapuje INDI/FAM na model powyzej, bulk insert w jednej transakcji SQLite (caly plik albo nic przy bledzie)
- `GET /api/gedcom/export` - generuje .ged (wlasny writer: HEAD, INDI z NAME/SEX/BIRT/DEAT/NOTE, FAM z HUSB/WIFE/CHIL/MARR, TRLR) do pobrania

## Wizualizacja drzewa

Vue komponent renderujacy wlasny SVG (bez D3/biblioteki grafowej):
- Layout: pokolenia w rzedach (przodkowie gora, potomkowie dol od wybranego roota), pary malzenskie obok siebie polaczone poziomo, dzieci podwieszone pod para pionowo.
- Karta osoby: imie + nazwisko, data ur. - data smierci, klik otwiera formularz edycji.
- Zoom/pan: CSS transform na kontenerze SVG.

## Formularz

Panel boczny/modal z polami: imie, nazwisko, plec, data+miejsce urodzenia, data+miejsce smierci, notatki. Osobny UI do tworzenia relacji rodzinnych: wybor istniejacej osoby lub tworzenie nowej jako malzonek/dziecko danej osoby.

## Import/eksport GEDCOM - szczegoly

- Parser: gotowa biblioteka npm (np. `read-gedcom`) zamiast wlasnego parsera - mniej bugow na edge-case'ach formatu dat/kodowania.
- Eksport: wlasny, prosty writer (gotowe biblioteki eksportujace sa niedojrzale) - generuje tylko tagi realnie uzywane w modelu, zgodny ze struktura GEDCOM 5.5.1.
- Import jest transakcyjny.

## Poza zakresem (YAGNI)

- Multi-user/logowanie.
- Zdjecia/multimedia (OBJE).
- Zrodla/cytaty (SOUR).
- Pelna reprezentacja wszystkich tagow GEDCOM w UI (tylko w modelu na tyle, zeby roundtrip import->eksport nie gubil danych uzywanych pol).
