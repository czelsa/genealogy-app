import { describe, it, expect, beforeEach } from 'vitest';
import { openGenealogyDb } from './db.js';
import { createEventPhotoRepo } from './eventPhotoRepo.js';

describe('eventPhotoRepo', () => {
  let repo;

  beforeEach(async () => {
    const db = await openGenealogyDb(`event-photo-repo-${Math.random()}`);
    repo = createEventPhotoRepo(db);
  });

  it('upserts a photo and adds blob URL', async () => {
    const blob = new Blob(['fake-jpg'], { type: 'image/jpeg' });
    const photo = await repo.upsert({
      owner_type: 'person',
      owner_id: 1,
      event_type: 'birth',
      blob,
    });

    expect(photo.owner_type).toBe('person');
    expect(photo.owner_id).toBe(1);
    expect(photo.event_type).toBe('birth');
    expect(photo.url).toMatch(/^blob:/);
  });

  it('replaces existing photo for same owner_type, owner_id, event_type', async () => {
    const blob1 = new Blob(['jpg1'], { type: 'image/jpeg' });
    const blob2 = new Blob(['jpg2'], { type: 'image/jpeg' });

    const p1 = await repo.upsert({
      owner_type: 'person',
      owner_id: 1,
      event_type: 'birth',
      blob: blob1,
    });

    const p2 = await repo.upsert({
      owner_type: 'person',
      owner_id: 1,
      event_type: 'birth',
      blob: blob2,
    });

    expect(p1.id).toBe(p2.id);
    expect(await repo.listByOwner('person', 1)).toHaveLength(1);
  });

  it('lists photos by owner_type and owner_id', async () => {
    const blob = new Blob(['jpg'], { type: 'image/jpeg' });
    await repo.upsert({
      owner_type: 'person',
      owner_id: 1,
      event_type: 'birth',
      blob,
    });
    await repo.upsert({
      owner_type: 'person',
      owner_id: 1,
      event_type: 'death',
      blob,
    });
    await repo.upsert({
      owner_type: 'person',
      owner_id: 2,
      event_type: 'birth',
      blob,
    });

    const photos = await repo.listByOwner('person', 1);
    expect(photos).toHaveLength(2);
    expect(photos.every((p) => p.owner_id === 1)).toBe(true);
    expect(photos.every((p) => p.url.startsWith('blob:'))).toBe(true);
  });

  it('removes a photo by id', async () => {
    const blob = new Blob(['jpg'], { type: 'image/jpeg' });
    const photo = await repo.upsert({
      owner_type: 'person',
      owner_id: 1,
      event_type: 'birth',
      blob,
    });

    await repo.remove(photo.id);
    const photos = await repo.listByOwner('person', 1);
    expect(photos).toHaveLength(0);
  });
});
