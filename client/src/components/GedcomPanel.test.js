import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import GedcomPanel from './GedcomPanel.vue';

vi.mock('../data/index.js');

describe('GedcomPanel', () => {
  beforeEach(() => {
    const { default: mockApi } = require('../data/index.js');
    mockApi.importGedcomFile = vi.fn().mockResolvedValue({ personsCreated: 1 });
    mockApi.downloadGedcomFile = vi.fn().mockResolvedValue({});
  });

  it('emits imported after a successful file upload', async () => {
    const { default: mockApi } = require('../data/index.js');
    const wrapper = mount(GedcomPanel);
    const input = wrapper.find('input[type="file"]');
    const file = new File(['0 HEAD'], 'sample.ged', { type: 'text/plain' });

    Object.defineProperty(file, 'arrayBuffer', {
      value: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    });

    Object.defineProperty(input.element, 'files', { value: [file] });
    await input.trigger('change');
    await flushPromises();

    expect(mockApi.importGedcomFile).toHaveBeenCalled();
    expect(wrapper.emitted('imported')).toBeTruthy();
  });

  it('exports GEDCOM on export button click', async () => {
    const { default: mockApi } = require('../data/index.js');
    const wrapper = mount(GedcomPanel);
    await wrapper.find('button.export-button').trigger('click');
    await flushPromises();

    expect(mockApi.downloadGedcomFile).toHaveBeenCalled();
  });
});
