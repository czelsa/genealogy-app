import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import GedcomPanel from './GedcomPanel.vue';

describe('GedcomPanel', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ personCount: 1 }) });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits imported after a successful file upload', async () => {
    const wrapper = mount(GedcomPanel);
    const input = wrapper.find('input[type="file"]');
    const file = new File(['0 HEAD'], 'sample.ged', { type: 'text/plain' });
    Object.defineProperty(input.element, 'files', { value: [file] });

    await input.trigger('change');
    await new Promise((resolve) => setTimeout(resolve));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/gedcom/import',
      expect.objectContaining({ method: 'POST' })
    );
    expect(wrapper.emitted('imported')).toBeTruthy();
  });
});
