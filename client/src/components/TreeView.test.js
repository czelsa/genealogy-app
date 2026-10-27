import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TreeView from './TreeView.vue';

describe('TreeView', () => {
  const graph = {
    persons: [
      { id: 1, first_name: 'Jan', last_name: 'Kowalski', birth_date: '1950', death_date: null },
      { id: 2, first_name: 'Piotr', last_name: 'Kowalski', birth_date: '1975', death_date: null },
    ],
    families: [{ id: 10, husband_id: 1, wife_id: null, children: [{ child_id: 2, pedigree: 'birth' }] }],
  };

  it('renders a card per person', () => {
    const wrapper = mount(TreeView, { props: { graph, rootId: 1 } });
    const cards = wrapper.findAll('.person-card');
    expect(cards).toHaveLength(2);
    expect(wrapper.text()).toContain('Jan Kowalski');
  });

  it('emits select-person when a card is clicked', async () => {
    const wrapper = mount(TreeView, { props: { graph, rootId: 1 } });
    await wrapper.findAll('.person-card')[0].trigger('click');
    expect(wrapper.emitted('select-person')).toBeTruthy();
  });
});
