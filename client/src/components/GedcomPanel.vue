<script setup>
import { ref } from 'vue';

const emit = defineEmits(['imported']);
const importing = ref(false);
const error = ref('');

async function handleFileChange(event) {
  const file = event.target.files[0];
  if (!file) return;
  importing.value = true;
  error.value = '';
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/gedcom/import', { method: 'POST', body: formData });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'import failed');
    }
    const result = await response.json();
    emit('imported', result);
  } catch (err) {
    error.value = err.message;
  } finally {
    importing.value = false;
    event.target.value = '';
  }
}
</script>

<template>
  <div class="gedcom-panel">
    <label class="upload-button">
      Importuj GEDCOM
      <input type="file" accept=".ged" @change="handleFileChange" hidden />
    </label>
    <a class="export-button" href="/api/gedcom/export">Eksportuj GEDCOM</a>
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
}

.upload-button:hover,
.export-button:hover {
  border-color: var(--color-primary, #3b5bdb);
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
