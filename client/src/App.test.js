import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import App from './App.vue';

vi.mock('./data/index.js');

describe('App', () => {
  beforeEach(() => {
    const { default: mockApi } = require('./data/index.js');
    mockApi.getTree = vi.fn().mockResolvedValue({
      persons: [{ id: 1, first_name: 'Jan', last_name: 'Kowalski', sex: 'M' }],
      families: [],
    });
    mockApi.createPerson = vi.fn().mockResolvedValue({ id: 2 });
    mockApi.updatePerson = vi.fn().mockResolvedValue({});
    mockApi.createFamily = vi.fn().mockResolvedValue({ id: 1 });
  });

  it('mounts and loads data', async () => {
    const wrapper = mount(App);
    await flushPromises();
    expect(wrapper.find('.app').exists()).toBe(true);
  });
});
