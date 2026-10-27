import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import EventPhotoUpload from './EventPhotoUpload.vue';

vi.mock('../data/index.js');

describe('EventPhotoUpload', () => {
  beforeEach(() => {
    const { default: mockApi } = require('../data/index.js');
    mockApi.uploadEventPhoto = vi.fn().mockResolvedValue({
      id: 1,
      url: 'blob:mock-url',
    });
    mockApi.deleteEventPhoto = vi.fn().mockResolvedValue({});
  });

  it('renders upload area initially', () => {
    const wrapper = mount(EventPhotoUpload, {
      props: { owner_type: 'person', owner_id: 1, event_type: 'birth' },
    });

    expect(wrapper.find('.upload-area').exists()).toBe(true);
    expect(wrapper.text()).toContain('Dodaj zdjecie (birth)');
  });

  it('has file input with JPG accept', () => {
    const wrapper = mount(EventPhotoUpload, {
      props: { owner_type: 'person', owner_id: 1, event_type: 'death' },
    });

    const input = wrapper.find('input[type="file"]');
    expect(input.attributes('accept')).toBe('image/jpeg');
  });
});
