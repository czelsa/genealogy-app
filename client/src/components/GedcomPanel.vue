<script setup>
import { ref } from 'vue';
import api from '../data/index.js';

const emit = defineEmits(['imported']);
const importing = ref(false);
const error = ref('');

async function handleFileChange(event) {
  const file = event.target.files[0];
  if (!file) return;
  importing.value = true;
  error.value = '';
  try {
    const buffer = await file.arrayBuffer();
    const result = await api.importGedcomFile(buffer);
    emit('imported', { personCount: result.personsCreated });
  } catch (err) {
    error.value = err.message;
  } finally {
    importing.value = false;
    event.target.value = '';
  }
}

async function handleExport() {
  try {
    await api.downloadGedcomFile();
  } catch (err) {
    error.value = err.message;
  }
}
</script>

<template>
  <div class="gedcom-panel">
    <label class="upload-button">
      Importuj GEDCOM
      <input type="file" accept=".ged" @change="handleFileChange" :disabled="importing" hidden />
    </label>
    <button type="button" class="export-button" @click="handleExport" :disabled="importing">
      Eksportuj GEDCOM
    </button>
    <span v-if="importing" class="status">Importowanie...</span>
    <span v-if="error" class="error">{{ error }}</span>
  </div>
</template>

<style scoped>
.gedcom-panel {
  display: flex;
  align-items: center;
  gap: 10px;
}

.upload-button,
.export-button {
  display: inline-flex;
  align-items: center;
  font-size: 0.9rem;
  padding: 8px 14px;
  border: 1px solid var(--color-border, #d8dce1);
  border-radius: 8px;
  background: var(--color-surface, #fff);
  color: var(--color-text, #1f2430);
  cursor: pointer;
  text-decoration: none;
  font-family: inherit;
}

.upload-button:hover:not(:disabled),
.export-button:hover:not(:disabled) {
  border-color: var(--color-primary, #3b5bdb);
}

.upload-button:disabled,
.export-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status {
  color: var(--color-text-muted, #6b7280);
  font-size: 0.85rem;
}

.error {
  color: #c0392b;
  font-size: 0.85rem;
}
</style>
