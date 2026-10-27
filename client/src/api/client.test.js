import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from './client.js';

describe('api client', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists persons via GET /api/persons', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ id: 1, first_name: 'Jan' }],
    });

    const persons = await api.listPersons();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/persons',
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } })
    );
    expect(persons).toEqual([{ id: 1, first_name: 'Jan' }]);
  });

  it('throws with server error message on failure', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'bad request' }),
    });

    await expect(api.listPersons()).rejects.toThrow('bad request');
  });
});
