import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PersonForm from './PersonForm.vue';
import EventPhotoUpload from './EventPhotoUpload.vue';

vi.mock('../data/index.js');

describe('PersonForm', () => {
  it('pre-fills fields from the person prop', () => {
    const person = { first_name: 'Jan', last_name: 'Kowalski', maiden_name: 'Nowak', sex: 'M', birth_date: '1950' };
    const wrapper = mount(PersonForm, {
      props: { person },
      global: { components: { EventPhotoUpload } },
    });
    expect(wrapper.find('input[name="first_name"]').element.value).toBe('Jan');
    expect(wrapper.find('input[name="maiden_name"]').element.value).toBe('Nowak');
    expect(wrapper.find('input[name="birth_date"]').element.value).toBe('1950');
  });

  it('emits save with form data including maiden_name on submit', async () => {
    const wrapper = mount(PersonForm, {
      props: { person: null },
      global: { components: { EventPhotoUpload } },
    });
    await wrapper.find('input[name="first_name"]').setValue('Anna');
    await wrapper.find('input[name="last_name"]').setValue('Nowak');
    await wrapper.find('input[name="maiden_name"]').setValue('Smith');
    await wrapper.find('form').trigger('submit');

    const saved = wrapper.emitted('save')[0][0];
    expect(saved.first_name).toBe('Anna');
    expect(saved.last_name).toBe('Nowak');
    expect(saved.maiden_name).toBe('Smith');
  });

  it('emits cancel when cancel is clicked', async () => {
    const wrapper = mount(PersonForm, {
      props: { person: null },
      global: { components: { EventPhotoUpload } },
    });
    await wrapper.find('button[type="button"]').trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('shows photo uploads when person has id', () => {
    const person = { id: 1, first_name: 'Jan', sex: 'M' };
    const wrapper = mount(PersonForm, {
      props: { person },
      global: { components: { EventPhotoUpload } },
    });
    expect(wrapper.find('.photos-section').exists()).toBe(true);
  });
});
