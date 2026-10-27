const BASE_URL = '/api';

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  listPersons: () => request('/persons'),
  getPerson: (id) => request(`/persons/${id}`),
  createPerson: (data) => request('/persons', { method: 'POST', body: JSON.stringify(data) }),
  updatePerson: (id, data) => request(`/persons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePerson: (id) => request(`/persons/${id}`, { method: 'DELETE' }),

  listFamilies: () => request('/families'),
  getFamily: (id) => request(`/families/${id}`),
  createFamily: (data) => request('/families', { method: 'POST', body: JSON.stringify(data) }),
  updateFamily: (id, data) => request(`/families/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addChild: (familyId, childId, pedigree = 'birth') =>
    request(`/families/${familyId}/children`, {
      method: 'POST',
      body: JSON.stringify({ child_id: childId, pedigree }),
    }),

  getTree: () => request('/tree'),
};
