import { openGenealogyDb } from './db.js';
import { createPersonRepo } from './personRepo.js';
import { createFamilyRepo } from './familyRepo.js';
import { createTreeRepo } from './treeRepo.js';
import { createEventPhotoRepo } from './eventPhotoRepo.js';
import { createGedcomRepo } from './gedcomRepo.js';

let db;
let personRepo;
let familyRepo;
let treeRepo;
let eventPhotoRepo;
let gedcomRepo;

async function initializeRepos() {
  if (!db) {
    db = await openGenealogyDb('genealogy');
    personRepo = createPersonRepo(db);
    familyRepo = createFamilyRepo(db);
    treeRepo = createTreeRepo(db);
    eventPhotoRepo = createEventPhotoRepo(db);
    gedcomRepo = createGedcomRepo();
  }
}

export const api = {
  async listPersons() {
    await initializeRepos();
    return personRepo.list();
  },

  async getPerson(id) {
    await initializeRepos();
    return personRepo.get(id);
  },

  async createPerson(data) {
    await initializeRepos();
    return personRepo.create(data);
  },

  async updatePerson(id, data) {
    await initializeRepos();
    return personRepo.update(id, data);
  },

  async deletePerson(id) {
    await initializeRepos();
    return personRepo.remove(id);
  },

  async listFamilies() {
    await initializeRepos();
    return familyRepo.list();
  },

  async getFamily(id) {
    await initializeRepos();
    return familyRepo.get(id);
  },

  async createFamily(data) {
    await initializeRepos();
    return familyRepo.create(data);
  },

  async updateFamily(id, data) {
    await initializeRepos();
    return familyRepo.update(id, data);
  },

  async addChild(familyId, childId, pedigree = 'birth') {
    await initializeRepos();
    return familyRepo.addChild(familyId, childId, pedigree);
  },

  async removeChild(familyId, childId) {
    await initializeRepos();
    return familyRepo.removeChild(familyId, childId);
  },

  async getTree() {
    await initializeRepos();
    return treeRepo.getGraph();
  },

  async listEventPhotos(owner_type, owner_id) {
    await initializeRepos();
    return eventPhotoRepo.listByOwner(owner_type, owner_id);
  },

  async uploadEventPhoto({ owner_type, owner_id, event_type, file }) {
    await initializeRepos();
    return eventPhotoRepo.upsert({ owner_type, owner_id, event_type, blob: file });
  },

  async deleteEventPhoto(photoId) {
    await initializeRepos();
    return eventPhotoRepo.remove(photoId);
  },

  async importGedcomFile(arrayBuffer) {
    await initializeRepos();
    const parsed = gedcomRepo.parseGedcomBuffer(arrayBuffer);
    return gedcomRepo.importGedcomIntoRepos({ personRepo, familyRepo }, parsed);
  },

  async exportGedcomFile() {
    await initializeRepos();
    const graph = await treeRepo.getGraph();
    return gedcomRepo.exportGedcom(graph);
  },

  async downloadGedcomFile() {
    await initializeRepos();
    const graph = await treeRepo.getGraph();
    const gedcomStr = gedcomRepo.exportGedcom(graph);
    gedcomRepo.downloadGedcomFile(gedcomStr);
  },
};

export default api;
