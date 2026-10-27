import { openDB } from 'idb';

export function openGenealogyDb(dbName = 'genealogy') {
  return openDB(dbName, 1, {
    upgrade(db) {
      db.createObjectStore('persons', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('families', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('eventPhotos', { keyPath: 'id', autoIncrement: true });
    },
  });
}
