import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import App from './App.vue';

describe('App', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        persons: [{ id: 1, first_name: 'Jan', last_name: 'Kowalski', birth_date: '1950', death_date: null }],
        families: [],
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads the tree on mount and renders a person card', async () => {
    const wrapper = mount(App);
    await flushPromises();
    expect(wrapper.text()).toContain('Jan Kowalski');
  });

  it('opens the person form when "Nowa osoba" is clicked', async () => {
    const wrapper = mount(App);
    await flushPromises();
    await wrapper.find('button[data-action="new-person"]').trigger('click');
    expect(wrapper.findComponent({ name: 'PersonForm' }).exists()).toBe(true);
  });
});
