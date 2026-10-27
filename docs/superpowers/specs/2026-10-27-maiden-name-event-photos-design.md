# Nazwisko rodowe + zdjecia zdarzen (urodzenie/slub/smierc) - Design

## Cel

Rozszerzenie istniejacej genealogy-app o:
1. Nazwisko rodowe (panienskie) dla osob.
2. Mozliwosc dolaczenia skanu JPG do zdarzen: urodzenie, slub, smierc.

## Model danych

```sql
ALTER TABLE person ADD COLUMN maiden_name TEXT;

CREATE TABLE event_photo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_type TEXT CHECK(owner_type IN ('person','family')) NOT NULL,
  owner_id INTEGER NOT NULL,
  event_type TEXT CHECK(event_type IN ('birth','death','marriage')) NOT NULL,
  file_path TEXT NOT NULL,
  original_name TEXT,
  UNIQUE(owner_type, owner_id, event_type)
);
```

- `maiden_name`: opcjonalne pole tekstowe na Person, wypelniane zazwyczaj dla kobiet (nazwisko sprzed slubu). Nie wplywa na logike relacji ani GEDCOM.
- `event_photo`: generyczna tabela, jeden rekord (i jeden plik) na kombinacje (owner_type, owner_id, event_type) wymuszona przez UNIQUE. Nowy upload dla tej samej trojki nadpisuje (usuwa stary plik z dysku, INSERT OR REPLACE semantyka w warstwie serwisu).
- Pliki fizyczne: `server/data/uploads/<uuid>.jpg`. Baza przechowuje tylko relatywna sciezke + oryginalna nazwe pliku.

## API

- `POST /api/event-photos` - multipart form z polami `owner_type` (`person`|`family`), `owner_id` (number), `event_type` (`birth`|`death`|`marriage`), `file` (JPG). Walidacja: `file.mimetype === 'image/jpeg'`, w przeciwnym razie 400. Upsert: jesli rekord dla (owner_type, owner_id, event_type) juz istnieje, stary plik jest usuwany z dysku i zastepowany nowym. Zwraca `{ id, owner_type, owner_id, event_type, url }` gdzie `url = /api/event-photos/:id/file`.
- `GET /api/event-photos?owner_type=X&owner_id=Y` - lista zdjec danego wlasciciela (0, 1, 2 lub 3 wpisy - po jednym na typ zdarzenia).
- `GET /api/event-photos/:id/file` - strumieniuje plik z dysku z `Content-Type: image/jpeg`.
- `DELETE /api/event-photos/:id` - usuwa rekord z bazy i plik z dysku.

`maiden_name` dochodzi jako zwykle pole do istniejacego `personService`/`personsRouter` (Person CRUD) - bez nowych endpointow dla tego pola.

## UI

**PersonForm** (`client/src/components/PersonForm.vue`):
- Nowe pole `maiden_name` ("Nazwisko rodowe") w siatce formularza, obok "Nazwisko". Widoczne zawsze (nie tylko dla kobiet) - user wypelnia tylko gdy dotyczy.
- Gdy formularz edytuje istniejaca osobe (`props.person` niepuste, tj. ma `id`): dwie dodatkowe sekcje "Zdjecie aktu urodzenia" i "Zdjecie aktu zgonu". Kazda: `<input type="file" accept="image/jpeg">`, miniatura istniejacego zdjecia (jesli jest), przycisk "Usun zdjecie".
- Dla nowej (jeszcze niezapisanej) osoby sekcje zdjec sa ukryte - trzeba najpierw zapisac osobe, potem edytowac ja ponownie zeby dodac zdjecia.

**TreeView** (`client/src/components/TreeView.vue`):
- Karta osoby: jesli `person.maiden_name` ustawione, pod imieniem/nazwiskiem doklejany tekst `(z d. {maiden_name})`.

## Poza zakresem (YAGNI)

- GEDCOM import/eksport nie obsluguje zdjec (tag OBJE) - zdjecia sa czysto lokalna funkcja aplikacji, plik .ged pozostaje bez zmian formatu.
- Zdjecie slubu (`event_type = 'marriage'`, `owner_type = 'family'`) jest w pelni obslugiwane przez API, ale nie ma jeszcze UI do edycji istniejacej rodziny (`FamilyEditor` obecnie tylko tworzy nowe rodziny) - UI dla zdjecia slubu zostaje na pozniej, razem z trybem edycji rodziny.
- Brak limitu rozmiaru pliku / kompresji - poza zakresem tej iteracji.
