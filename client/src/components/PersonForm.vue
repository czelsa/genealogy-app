<script setup>
import { reactive, watch } from 'vue';
import EventPhotoUpload from './EventPhotoUpload.vue';

const props = defineProps({ person: { type: Object, default: null } });
const emit = defineEmits(['save', 'cancel']);

const form = reactive({
  first_name: '',
  last_name: '',
  maiden_name: '',
  sex: 'U',
  birth_date: '',
  birth_place: '',
  death_date: '',
  death_place: '',
  notes: '',
});

watch(
  () => props.person,
  (person) => {
    Object.assign(form, {
      first_name: person?.first_name ?? '',
      last_name: person?.last_name ?? '',
      maiden_name: person?.maiden_name ?? '',
      sex: person?.sex ?? 'U',
      birth_date: person?.birth_date ?? '',
      birth_place: person?.birth_place ?? '',
      death_date: person?.death_date ?? '',
      death_place: person?.death_place ?? '',
      notes: person?.notes ?? '',
    });
  },
  { immediate: true }
);

function submit() {
  emit('save', { ...form });
}
</script>

<template>
  <form class="person-form" @submit.prevent="submit">
    <h3 class="form-title">{{ person ? 'Edytuj osobe' : 'Nowa osoba' }}</h3>
    <div class="form-grid">
      <label>Imie <input name="first_name" v-model="form.first_name" /></label>
      <label>Nazwisko <input name="last_name" v-model="form.last_name" /></label>
      <label>Nazwisko rodowe <input name="maiden_name" v-model="form.maiden_name" /></label>
      <label>
        Plec
        <select name="sex" v-model="form.sex">
          <option value="M">M</option>
          <option value="F">F</option>
          <option value="U">U</option>
        </select>
      </label>
      <label>Data urodzenia <input name="birth_date" v-model="form.birth_date" placeholder="12 MAR 1950" /></label>
      <label>Miejsce urodzenia <input name="birth_place" v-model="form.birth_place" /></label>
      <label>Data smierci <input name="death_date" v-model="form.death_date" /></label>
      <label>Miejsce smierci <input name="death_place" v-model="form.death_place" /></label>
    </div>
    <div v-if="person?.id" class="photos-section">
      <h4>Zdjecia</h4>
      <EventPhotoUpload owner_type="person" :owner_id="person.id" event_type="birth" />
      <EventPhotoUpload owner_type="person" :owner_id="person.id" event_type="death" />
    </div>
    <label class="notes-field">Notatki <textarea name="notes" v-model="form.notes" rows="3"></textarea></label>
    <div class="form-actions">
      <button type="submit">Zapisz</button>
      <button type="button" @click="emit('cancel')">Anuluj</button>
    </div>
  </form>
</template>

<style scoped>
.form-title {
  margin-bottom: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
}

.photos-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.photos-section h4 {
  margin: 0 0 12px 0;
  font-size: 0.95rem;
}

.notes-field {
  margin-top: 12px;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
</style>
