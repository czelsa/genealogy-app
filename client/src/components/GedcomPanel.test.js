import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import GedcomPanel from './GedcomPanel.vue';

vi.mock('../data/index.js', () => ({
  default: {
    importGedcomFile: vi.fn(),
    downloadGedcomFile: vi.fn(),
  },
}));

describe('GedcomPanel', () => {
  it('renders import and export buttons', () => {
    const wrapper = mount(GedcomPanel);
    expect(wrapper.text()).toContain('Importuj GEDCOM');
    expect(wrapper.text()).toContain('Eksportuj GEDCOM');
  });

  it('has file input for GEDCOM import', () => {
    const wrapper = mount(GedcomPanel);
    const input = wrapper.find('input[type="file"]');
    expect(input.attributes('accept')).toBe('.ged');
  });
});
