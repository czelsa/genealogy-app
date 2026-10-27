<script setup>
import { reactive } from 'vue';

const props = defineProps({
  persons: { type: Array, required: true },
  family: { type: Object, default: null },
});
const emit = defineEmits(['save-family', 'cancel']);

const form = reactive({
  husband_id: props.family?.husband_id ?? null,
  wife_id: props.family?.wife_id ?? null,
  marriage_date: props.family?.marriage_date ?? '',
  marriage_place: props.family?.marriage_place ?? '',
});

function save() {
  emit('save-family', { ...form });
}
</script>

<template>
  <div class="family-editor">
    <h3 class="form-title">Nowa rodzina</h3>
    <div class="form-grid">
      <label>
        Maz
        <select name="husband_id" v-model.number="form.husband_id">
          <option :value="null">-</option>
          <option v-for="p in persons" :key="p.id" :value="p.id">{{ p.first_name }} {{ p.last_name }}</option>
        </select>
      </label>
      <label>
        Zona
        <select name="wife_id" v-model.number="form.wife_id">
          <option :value="null">-</option>
          <option v-for="p in persons" :key="p.id" :value="p.id">{{ p.first_name }} {{ p.last_name }}</option>
        </select>
      </label>
      <label>Data slubu <input v-model="form.marriage_date" placeholder="1 JUN 1980" /></label>
      <label>Miejsce slubu <input v-model="form.marriage_place" /></label>
    </div>
    <div class="form-actions">
      <button type="button" class="button-primary" data-action="save" @click="save">Zapisz rodzine</button>
      <button type="button" data-action="cancel" @click="emit('cancel')">Anuluj</button>
    </div>
  </div>
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

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
</style>
