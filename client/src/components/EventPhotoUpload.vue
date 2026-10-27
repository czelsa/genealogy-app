<script setup>
import { ref, computed } from 'vue';
import api from '../data/index.js';

const props = defineProps({
  owner_type: { type: String, required: true },
  owner_id: { type: Number, required: true },
  event_type: { type: String, required: true },
});

const emit = defineEmits(['photo-uploaded']);

const file = ref(null);
const error = ref(null);
const loading = ref(false);

const hasPhoto = computed(() => {
  return file.value && file.value.url;
});

async function handleFileSelect(event) {
  const selected = event.target.files?.[0];
  if (!selected) return;

  error.value = null;

  if (selected.type !== 'image/jpeg') {
    error.value = 'Dozwolone sa tylko pliki JPG';
    return;
  }

  loading.value = true;
  try {
    const uploaded = await api.uploadEventPhoto({
      owner_type: props.owner_type,
      owner_id: props.owner_id,
      event_type: props.event_type,
      file: selected,
    });
    file.value = uploaded;
    emit('photo-uploaded', uploaded);
  } catch (err) {
    error.value = err.message || 'Nie udalo sie wgrac zdjecia';
  } finally {
    loading.value = false;
  }
}

async function deletePhoto() {
  if (!file.value) return;
  loading.value = true;
  try {
    await api.deleteEventPhoto(file.value.id);
    file.value = null;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="event-photo-upload">
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="hasPhoto" class="photo-preview">
      <img :src="file.url" :alt="event_type" />
      <button type="button" class="button-danger" @click="deletePhoto" :disabled="loading">Usun zdjecie</button>
    </div>
    <div v-else class="upload-area">
      <input
        type="file"
        accept="image/jpeg"
        @change="handleFileSelect"
        :disabled="loading"
        style="display: none"
        ref="fileInput"
      />
      <button
        type="button"
        class="button-secondary"
        @click="$refs.fileInput?.click()"
        :disabled="loading"
      >
        {{ loading ? 'Wgrajanie...' : `Dodaj zdjecie (${event_type})` }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.event-photo-upload {
  margin-top: 12px;
}

.error-message {
  color: var(--color-error, #d32f2f);
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.photo-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.photo-preview img {
  max-width: 200px;
  max-height: 200px;
  border-radius: var(--radius);
}

.upload-area {
  display: flex;
  justify-content: center;
}

.button-secondary,
.button-danger {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  cursor: pointer;
  border-radius: var(--radius);
  font-size: 0.9rem;
}

.button-secondary:hover:not(:disabled) {
  background: var(--color-surface);
}

.button-danger {
  background: rgba(211, 47, 47, 0.1);
  border-color: #d32f2f;
  color: #d32f2f;
}

.button-danger:hover:not(:disabled) {
  background: rgba(211, 47, 47, 0.2);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
