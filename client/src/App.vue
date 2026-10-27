<script setup>
import { ref, onMounted } from 'vue';
import { api } from './api/client.js';
import TreeView from './components/TreeView.vue';
import PersonForm from './components/PersonForm.vue';
import FamilyEditor from './components/FamilyEditor.vue';
import GedcomPanel from './components/GedcomPanel.vue';

const graph = ref({ persons: [], families: [] });
const rootId = ref(null);
const editingPerson = ref(null);
const showPersonForm = ref(false);
const showFamilyEditor = ref(false);

async function reload() {
  graph.value = await api.getTree();
  if (rootId.value == null && graph.value.persons.length > 0) {
    rootId.value = graph.value.persons[0].id;
  }
}

async function reloadAfterImport(result) {
  await reload();
  const importedCount = result?.personCount ?? 0;
  if (importedCount > 0) {
    const firstImported = graph.value.persons[graph.value.persons.length - importedCount];
    if (firstImported) rootId.value = firstImported.id;
  }
}

onMounted(reload);

function openNewPerson() {
  editingPerson.value = null;
  showPersonForm.value = true;
}

function openEditPerson(personId) {
  editingPerson.value = graph.value.persons.find((p) => p.id === personId) ?? null;
  showPersonForm.value = true;
}

async function savePerson(data) {
  if (editingPerson.value) {
    await api.updatePerson(editingPerson.value.id, data);
  } else {
    await api.createPerson(data);
  }
  showPersonForm.value = false;
  await reload();
}

async function saveFamily(data) {
  await api.createFamily(data);
  showFamilyEditor.value = false;
  await reload();
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>Drzewo genealogiczne</h1>
      <div class="actions">
        <button type="button" class="button-primary" data-action="new-person" @click="openNewPerson">
          + Nowa osoba
        </button>
        <button type="button" data-action="new-family" @click="showFamilyEditor = true">+ Nowa rodzina</button>
        <GedcomPanel @imported="reloadAfterImport" />
      </div>
    </header>
    <div class="layout">
      <aside class="person-list">
        <h2>Osoby</h2>
        <ul>
          <li v-for="p in graph.persons" :key="p.id">
            <button
              type="button"
              class="person-list-item"
              :class="{ active: p.id === rootId }"
              data-action="set-root"
              @click="rootId = p.id"
            >
              {{ p.first_name }} {{ p.last_name }}
            </button>
          </li>
        </ul>
      </aside>
      <main class="tree-panel">
        <TreeView v-if="rootId != null" :graph="graph" :root-id="rootId" @select-person="openEditPerson" />
        <p v-else class="empty-hint">Dodaj pierwsza osobe, zeby zobaczyc drzewo.</p>
      </main>
    </div>
    <div v-if="showPersonForm" class="modal-overlay" @click.self="showPersonForm = false">
      <div class="modal-card">
        <PersonForm :person="editingPerson" @save="savePerson" @cancel="showPersonForm = false" />
      </div>
    </div>
    <div v-if="showFamilyEditor" class="modal-overlay" @click.self="showFamilyEditor = false">
      <div class="modal-card">
        <FamilyEditor :persons="graph.persons" @save-family="saveFamily" @cancel="showFamilyEditor = false" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 20px 60px;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.person-list {
  min-width: 200px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-card);
  padding: 16px;
}

.person-list h2 {
  font-size: 0.95rem;
  color: var(--color-text-muted);
  margin-bottom: 10px;
}

.person-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.person-list-item {
  width: 100%;
  text-align: left;
  border: 1px solid transparent;
  background: transparent;
}

.person-list-item:hover {
  background: var(--color-bg);
}

.person-list-item.active {
  background: rgba(59, 91, 219, 0.1);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.tree-panel {
  flex: 1;
  min-width: 0;
}

.empty-hint {
  color: var(--color-text-muted);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(17, 20, 28, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 10;
}

.modal-card {
  background: var(--color-surface);
  border-radius: var(--radius);
  box-shadow: 0 10px 30px rgba(16, 24, 40, 0.2);
  padding: 24px;
  max-width: 480px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}
</style>
