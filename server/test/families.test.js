import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createDb } from '../src/db/connection.js';

describe('families API', () => {
  let app;

  beforeEach(() => {
    app = createApp(createDb(':memory:'));
  });

  async function createPerson(name) {
    const response = await request(app).post('/api/persons').send({ first_name: name });
    return response.body.id;
  }

  it('creates a family with husband and wife', async () => {
    const husbandId = await createPerson('Jan');
    const wifeId = await createPerson('Anna');

    const created = await request(app)
      .post('/api/families')
      .send({ husband_id: husbandId, wife_id: wifeId, marriage_date: '1 JAN 1980' });

    expect(created.status).toBe(201);
    expect(created.body.husband_id).toBe(husbandId);
    expect(created.body.children).toEqual([]);
  });

  it('adds a child to a family', async () => {
    const husbandId = await createPerson('Jan');
    const childId = await createPerson('Piotr');
    const family = await request(app).post('/api/families').send({ husband_id: husbandId });

    const withChild = await request(app)
      .post(`/api/families/${family.body.id}/children`)
      .send({ child_id: childId, pedigree: 'birth' });

    expect(withChild.status).toBe(201);
    expect(withChild.body.children).toEqual([{ child_id: childId, pedigree: 'birth' }]);
  });

  it('returns 404 adding a child to a missing family', async () => {
    const childId = await createPerson('Piotr');
    const response = await request(app).post('/api/families/999/children').send({ child_id: childId });
    expect(response.status).toBe(404);
  });
});
