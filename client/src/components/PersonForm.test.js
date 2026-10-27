import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PersonForm from './PersonForm.vue';

describe('PersonForm', () => {
  it('pre-fills fields from the person prop', () => {
    const person = { first_name: 'Jan', last_name: 'Kowalski', sex: 'M', birth_date: '1950' };
    const wrapper = mount(PersonForm, { props: { person } });
    expect(wrapper.find('input[name="first_name"]').element.value).toBe('Jan');
    expect(wrapper.find('input[name="birth_date"]').element.value).toBe('1950');
  });

  it('emits save with form data on submit', async () => {
    const wrapper = mount(PersonForm, { props: { person: null } });
    await wrapper.find('input[name="first_name"]').setValue('Anna');
    await wrapper.find('input[name="last_name"]').setValue('Nowak');
    await wrapper.find('form').trigger('submit');

    const saved = wrapper.emitted('save')[0][0];
    expect(saved.first_name).toBe('Anna');
    expect(saved.last_name).toBe('Nowak');
  });

  it('emits cancel when cancel is clicked', async () => {
    const wrapper = mount(PersonForm, { props: { person: null } });
    await wrapper.find('button[type="button"]').trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });
});
