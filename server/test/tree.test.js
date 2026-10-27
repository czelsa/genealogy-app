import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createDb } from '../src/db/connection.js';

describe('tree API', () => {
  let app;

  beforeEach(() => {
    app = createApp(createDb(':memory:'));
  });

  it('returns persons and families with children', async () => {
    const husband = await request(app).post('/api/persons').send({ first_name: 'Jan' });
    const wife = await request(app).post('/api/persons').send({ first_name: 'Anna' });
    const child = await request(app).post('/api/persons').send({ first_name: 'Piotr' });
    const family = await request(app)
      .post('/api/families')
      .send({ husband_id: husband.body.id, wife_id: wife.body.id });
    await request(app).post(`/api/families/${family.body.id}/children`).send({ child_id: child.body.id });

    const response = await request(app).get('/api/tree');

    expect(response.status).toBe(200);
    expect(response.body.persons.length).toBe(3);
    expect(response.body.families.length).toBe(1);
    expect(response.body.families[0].children).toEqual([{ child_id: child.body.id, pedigree: 'birth' }]);
  });
});
