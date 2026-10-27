import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FamilyEditor from './FamilyEditor.vue';

describe('FamilyEditor', () => {
  const persons = [
    { id: 1, first_name: 'Jan', last_name: 'Kowalski' },
    { id: 2, first_name: 'Anna', last_name: 'Nowak' },
  ];

  it('lists persons as husband/wife options', () => {
    const wrapper = mount(FamilyEditor, { props: { persons, family: null } });
    const husbandOptions = wrapper.find('select[name="husband_id"]').findAll('option');
    expect(husbandOptions).toHaveLength(3);
  });

  it('emits save-family with selected ids', async () => {
    const wrapper = mount(FamilyEditor, { props: { persons, family: null } });
    await wrapper.find('select[name="husband_id"]').setValue('1');
    await wrapper.find('select[name="wife_id"]').setValue('2');
    await wrapper.find('button[data-action="save"]').trigger('click');

    const saved = wrapper.emitted('save-family')[0][0];
    expect(saved.husband_id).toBe(1);
    expect(saved.wife_id).toBe(2);
  });

  it('emits cancel', async () => {
    const wrapper = mount(FamilyEditor, { props: { persons, family: null } });
    await wrapper.find('button[data-action="cancel"]').trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });
});
