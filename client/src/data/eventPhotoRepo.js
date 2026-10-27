function addUrl(photo) {
  return { ...photo, url: URL.createObjectURL(photo.blob) };
}

export function createEventPhotoRepo(db) {
  return {
    async upsert(data) {
      const { owner_type, owner_id, event_type, blob } = data;
      const all = await db.getAll('eventPhotos');
      const existing = all.find(
        (p) => p.owner_type === owner_type && p.owner_id === owner_id && p.event_type === event_type
      );

      if (existing) {
        await db.put('eventPhotos', { ...existing, blob });
        const updated = await db.get('eventPhotos', existing.id);
        return addUrl(updated);
      }

      const id = await db.add('eventPhotos', { owner_type, owner_id, event_type, blob });
      const photo = await db.get('eventPhotos', id);
      return addUrl(photo);
    },
    async listByOwner(owner_type, owner_id) {
      const all = await db.getAll('eventPhotos');
      return all
        .filter((p) => p.owner_type === owner_type && p.owner_id === owner_id)
        .map(addUrl);
    },
    async remove(id) {
      await db.delete('eventPhotos', id);
    },
  };
}
