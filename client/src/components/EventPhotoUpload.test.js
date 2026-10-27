import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import EventPhotoUpload from './EventPhotoUpload.vue';

vi.mock('../data/index.js');

describe('EventPhotoUpload', () => {
  beforeEach(() => {
    const { default: mockApi } = require('../data/index.js');
    mockApi.uploadEventPhoto = vi.fn().mockResolvedValue({
      id: 1,
      owner_type: 'person',
      owner_id: 1,
      event_type: 'birth',
      url: 'blob:mock-url',
    });
    mockApi.deleteEventPhoto = vi.fn().mockResolvedValue({});
  });

  it('rejects non-JPG files with error message', async () => {
    const wrapper = mount(EventPhotoUpload, {
      props: { owner_type: 'person', owner_id: 1, event_type: 'birth' },
    });

    const file = new File(['content'], 'test.png', { type: 'image/png' });
    const input = wrapper.find('input[type="file"]');

    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false,
    });

    await input.trigger('change');
    await flushPromises();

    expect(wrapper.text()).toContain('Dozwolone sa tylko pliki JPG');
  });

  it('uploads JPG files', async () => {
    const { default: mockApi } = require('../data/index.js');
    const wrapper = mount(EventPhotoUpload, {
      props: { owner_type: 'person', owner_id: 1, event_type: 'birth' },
    });

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const input = wrapper.find('input[type="file"]');

    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false,
    });

    await input.trigger('change');
    await flushPromises();

    expect(mockApi.uploadEventPhoto).toHaveBeenCalledWith(
      expect.objectContaining({
        owner_type: 'person',
        owner_id: 1,
        event_type: 'birth',
        file,
      })
    );
  });

  it('displays photo after upload', async () => {
    const wrapper = mount(EventPhotoUpload, {
      props: { owner_type: 'person', owner_id: 1, event_type: 'birth' },
    });

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const input = wrapper.find('input[type="file"]');

    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false,
    });

    await input.trigger('change');
    await flushPromises();

    expect(wrapper.find('.photo-preview').exists()).toBe(true);
  });
});
