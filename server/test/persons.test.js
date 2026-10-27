import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createDb } from '../src/db/connection.js';

describe('persons API', () => {
  let app;

  beforeEach(() => {
    app = createApp(createDb(':memory:'));
  });

  it('creates and fetches a person', async () => {
    const created = await request(app)
      .post('/api/persons')
      .send({ first_name: 'Anna', last_name: 'Nowak', sex: 'F' });
    expect(created.status).toBe(201);
    expect(created.body.id).toBeTypeOf('number');

    const fetched = await request(app).get(`/api/persons/${created.body.id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.first_name).toBe('Anna');
  });

  it('returns 404 for missing person', async () => {
    const response = await request(app).get('/api/persons/999');
    expect(response.status).toBe(404);
  });

  it('updates a person', async () => {
    const created = await request(app).post('/api/persons').send({ first_name: 'Jan' });
    const updated = await request(app)
      .put(`/api/persons/${created.body.id}`)
      .send({ first_name: 'Janek', last_name: 'Kowalski' });
    expect(updated.body.first_name).toBe('Janek');
  });

  it('deletes a person', async () => {
    const created = await request(app).post('/api/persons').send({ first_name: 'Ewa' });
    const deleted = await request(app).delete(`/api/persons/${created.body.id}`);
    expect(deleted.status).toBe(204);
    const fetched = await request(app).get(`/api/persons/${created.body.id}`);
    expect(fetched.status).toBe(404);
  });

  it('lists persons', async () => {
    await request(app).post('/api/persons').send({ first_name: 'A', last_name: 'Z' });
    await request(app).post('/api/persons').send({ first_name: 'B', last_name: 'Y' });
    const response = await request(app).get('/api/persons');
    expect(response.body.length).toBe(2);
  });
});
