<script setup>
import { computed } from 'vue';
import { layoutTree } from '../tree/layout.js';

const CARD_W = 220;
const CARD_H = 76;
const AVATAR_R = 18;
const AVATAR_CX = 30;

const props = defineProps({
  graph: { type: Object, required: true },
  rootId: { type: Number, required: true },
});
const emit = defineEmits(['select-person']);

const layout = computed(() => layoutTree(props.graph, props.rootId));
const width = computed(() =>
  Math.max(600, ...layout.value.nodes.map((n) => n.x + CARD_W + 60))
);
const height = computed(() =>
  Math.max(300, ...layout.value.nodes.map((n) => n.y + CARD_H + 60))
);

function sexClass(sex) {
  if (sex === 'M') return 'sex-male';
  if (sex === 'F') return 'sex-female';
  return 'sex-unknown';
}

function displayName(person) {
  const full = `${person.first_name ?? ''} ${person.last_name ?? ''}`.trim();
  return full || '(brak imienia)';
}

function spousePath(edge) {
  const fromCx = edge.from.x + CARD_W;
  const fromCy = edge.from.y + CARD_H / 2;
  const toCx = edge.to.x;
  const toCy = edge.to.y + CARD_H / 2;
  return `M ${fromCx} ${fromCy} L ${toCx} ${toCy}`;
}

function spouseMid(edge) {
  return {
    x: (edge.from.x + CARD_W + edge.to.x) / 2,
    y: edge.from.y + CARD_H / 2,
  };
}

function parentChildPath(edge) {
  const fromCx = edge.from.x + CARD_W / 2;
  const fromBottom = edge.from.y + CARD_H;
  const toCx = edge.to.x + CARD_W / 2;
  const toTop = edge.to.y;
  const midY = fromBottom + (toTop - fromBottom) / 2;
  return `M ${fromCx} ${fromBottom} V ${midY} H ${toCx} V ${toTop}`;
}
</script>

<template>
  <svg :width="width" :height="height" class="tree-view">
    <path
      v-for="(edge, index) in layout.edges.filter((e) => e.type === 'parent-child')"
      :key="`pc-${index}`"
      :d="parentChildPath(edge)"
      class="edge edge-parent-child"
    />
    <path
      v-for="(edge, index) in layout.edges.filter((e) => e.type === 'spouse')"
      :key="`sp-${index}`"
      :d="spousePath(edge)"
      class="edge edge-spouse"
    />
    <circle
      v-for="(edge, index) in layout.edges.filter((e) => e.type === 'spouse')"
      :key="`sp-dot-${index}`"
      :cx="spouseMid(edge).x"
      :cy="spouseMid(edge).y"
      r="5"
      class="spouse-dot"
    />
    <g
      v-for="node in layout.nodes"
      :key="node.id"
      :transform="`translate(${node.x}, ${node.y})`"
      class="person-card"
      :class="sexClass(node.person.sex)"
      @click="emit('select-person', node.id)"
    >
      <rect class="card-bg" :width="CARD_W" :height="CARD_H" rx="12" />
      <circle class="avatar-bg" :cx="AVATAR_CX" :cy="CARD_H / 2" :r="AVATAR_R" />
      <path
        class="avatar-icon"
        :transform="`translate(${AVATAR_CX - 11}, ${CARD_H / 2 - 11})`"
        d="M11 11.5a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2.2c-4.4 0-8.8 2.2-8.8 5v2.3h17.6v-2.3c0-2.8-4.4-5-8.8-5Z"
      />
      <text class="card-name" :x="AVATAR_CX + AVATAR_R + 10" y="26" text-anchor="start">
        {{ displayName(node.person) }}
      </text>
      <text
        v-if="node.person.maiden_name"
        class="card-maiden"
        :x="AVATAR_CX + AVATAR_R + 10"
        y="40"
        text-anchor="start"
      >
        (z d. {{ node.person.maiden_name }})
      </text>
      <text class="card-dates" :x="AVATAR_CX + AVATAR_R + 10" y="58" text-anchor="start">
        {{ node.person.birth_date || '?' }} &ndash; {{ node.person.death_date || '' }}
      </text>
    </g>
  </svg>
</template>

<style scoped>
.tree-view {
  background: var(--color-bg, #f5f5f5);
  border-radius: var(--radius, 10px);
}

.edge {
  fill: none;
  stroke: #b7bec9;
  stroke-width: 1.5;
}

.edge-spouse {
  stroke: #9aa3b2;
}

.person-card {
  cursor: pointer;
}

.spouse-dot {
  fill: #fff;
  stroke: #9aa3b2;
  stroke-width: 1.5;
}

.card-bg {
  stroke-width: 1;
  filter: drop-shadow(0 1px 2px rgba(16, 24, 40, 0.12));
  transition: filter 0.15s ease;
}

.person-card:hover .card-bg {
  filter: drop-shadow(0 4px 10px rgba(16, 24, 40, 0.18));
}

.sex-male .card-bg {
  fill: #dbeafe;
  stroke: #93c5fd;
}

.sex-female .card-bg {
  fill: #fbe1ec;
  stroke: #f3b4cf;
}

.sex-unknown .card-bg {
  fill: #eef0f3;
  stroke: #d8dce1;
}

.sex-male .avatar-bg {
  fill: #bfdbfe;
}

.sex-female .avatar-bg {
  fill: #f7c7dd;
}

.sex-unknown .avatar-bg {
  fill: #dfe3e8;
}

.avatar-icon {
  fill: rgba(31, 36, 48, 0.45);
}

.card-name {
  font-size: 13px;
  font-weight: 600;
  fill: var(--color-text, #1f2430);
}

.card-maiden {
  font-size: 10.5px;
  font-style: italic;
  fill: var(--color-text-muted, #6b7280);
}

.card-dates {
  font-size: 11px;
  fill: var(--color-text-muted, #6b7280);
}
</style>
