# Przejscie na w pelni lokalna, statyczna apke (bez serwera) - Design

## Status wobec wczesniejszych dokumentow

Ten spec **zastepuje** architekture z `2026-10-27-genealogy-tree-app-design.md` (serwer Express+SQLite) i **wchlania** zakres z `2026-10-27-maiden-name-event-photos-design.md` (nazwisko rodowe + zdjecia zdarzen) - te funkcje sa tu zaprojektowane na nowo pod lokalna warstwe danych zamiast API. Odpowiadajace plany implementacji (`2026-10-27-genealogy-tree-app.md`, `2026-10-27-maiden-name-event-photos.md`) pozostaja w repo jako historia, ale nie sa juz scieżka do wykonania - ten dokument i jego plan implementacji sa teraz obowiazujace.

## Cel

Appka ma dzialac w 100% lokalnie w przegladarce (telefon i komputer), bez wlasnego serwera/backendu, hostowana za darmo (GitHub Pages) i instalowalna jako PWA ("Dodaj do ekranu glownego").

## Architektura

Jeden statyczny klient (Vue 3 + Vite). Zero serwera - `server/` (Express, better-sqlite3, multer, Dockerfile, render.yaml) zostaje usuniety z repo. Dane (osoby, rodziny, zdjecia) przechowywane w **IndexedDB** w przegladarce, przez cienki promisyfikujacy wrapper `idb` (npm, ~1kB, zero wlasnej logiki storage). GEDCOM import/eksport dziala w calosci w przegladarce (`read-gedcom` jest kompatybilny z browserem). Hosting: GitHub Pages z repo `czelsa/genealogy-app`, auto-deploy przez GitHub Actions przy kazdym pushu na `main`.

## Model danych (IndexedDB)

Baza `genealogy`, wersja 1, trzy object store'y:

```js
persons      keyPath: 'id' (autoIncrement)
  { id, first_name, last_name, maiden_name, sex, birth_date, birth_place, death_date, death_place, notes }

families     keyPath: 'id' (autoIncrement)
  { id, husband_id, wife_id, marriage_date, marriage_place, divorce_date,
    children: [{ child_id, pedigree }] }

eventPhotos  keyPath: 'id' (autoIncrement)
  { id, owner_type, owner_id, event_type, blob, original_name }
```

`family_child` znika jako osobny store - `children` jest zagniezdzone wprost w rekordzie rodziny (dokladnie tak jak `graph.families[].children` jest juz dzis zwracane do klienta przez `/api/tree`, co oznacza zero zmian w `layout.js` i `TreeView.vue`). Unikalnosc jednego zdjecia na (`owner_type`,`owner_id`,`event_type`) jest pilnowana w kodzie warstwy danych (szukaj istniejacego wpisu przed zapisem, nadpisz go), nie przez baze.

## Warstwa danych (`client/src/data/`)

Zastepuje `client/src/api/client.js`. Pliki:
- `db.js` - otwiera/migruje IndexedDB (`idb`'s `openDB`)
- `personRepo.js`, `familyRepo.js`, `treeRepo.js`, `eventPhotoRepo.js`, `gedcomRepo.js`

Eksportowany `api` obiekt zachowuje te same nazwy metod co dzisiejszy `client/src/api/client.js` (`listPersons`, `getPerson`, `createPerson`, `updatePerson`, `deletePerson`, `listFamilies`, `getFamily`, `createFamily`, `updateFamily`, `addChild`, `getTree`, `listEventPhotos`, `deleteEventPhoto`) - `App.vue`, `PersonForm.vue`, `FamilyEditor.vue` zmieniaja tylko import, logika zostaje. Realne zmiany tam, gdzie siec faktycznie znikla:

- `uploadEventPhoto({ owner_type, owner_id, event_type, file })` - zwykly obiekt z `File`, nie `FormData` (nie ma juz multipart/HTTP).
- `GedcomPanel.vue` - import czyta `file.arrayBuffer()` bezposrednio i woła `gedcomRepo.importFile(arrayBuffer)`; eksport woła `gedcomRepo.exportToFile()`, ktore buduje `Blob` i odpala pobranie przez tymczasowy `<a download="export.ged">` (bez `fetch`, bez endpointu).

## GEDCOM

`gedcomImport.js` i `gedcomExport.js` z `server/src/services/` przenoszone niemal 1:1 do `client/src/data/gedcomRepo.js`, zastepujac zapisy `db.prepare(...).run(...)` (better-sqlite3) wywolaniami na nowych repo (`personRepo.create`, `familyRepo.create`, itd.). Logika parsowania (`read-gedcom`) i generowania tekstu GEDCOM zostaje identyczna.

## PWA i deploy

- `vite.config.js`: `base: '/genealogy-app/'` (sciezka projektu GitHub Pages).
- `manifest.webmanifest`, rejestracja service workera w `main.js` dostosowane do tej sciezki (uzycie `import.meta.env.BASE_URL`).
- `.github/workflows/deploy-pages.yml` - buduje `client/` i publikuje `client/dist` na GitHub Pages (`actions/upload-pages-artifact` + `actions/deploy-pages`) przy pushu na `main`.
- Repo ustawienie "Pages: Source = GitHub Actions" (jednorazowo, przez `gh api` lub recznie w ustawieniach repo).
- Docelowy adres: `https://czelsa.github.io/genealogy-app/` - dziala bez wlaczonego komputera, bez karty platniczej, instalowalne na telefonie przez "Dodaj do ekranu glownego".

## Sprzatanie repo

- Usuniecie: `server/` (caly katalog), `Dockerfile`, `.dockerignore`, `render.yaml` (byly pod architekture serwerowa/Docker, teraz nieaktualne).
- `docs/superpowers/plans/2026-10-27-genealogy-tree-app.md` i `docs/superpowers/plans/2026-10-27-maiden-name-event-photos.md` zostaja w repo jako historia (nieaktualne, nadpisane tym dokumentem), nie sa usuwane.

## Poza zakresem (YAGNI)

- Multi-user/synchronizacja miedzy urzadzeniami (dane sa per-przegladarka/urzadzenie, brak backendu do synchronizacji).
- Pelne offline cache app-shell w service workerze (obecny SW to minimalny pass-through, wystarczajacy do instalowalnosci PWA) - rozszerzenie na pozniej, jesli potrzebne.
- Eksport/import calej bazy IndexedDB jako backup (poza GEDCOM) - nie proszono o to.
