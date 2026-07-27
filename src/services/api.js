const BASE_URL = 'http://localhost:8000';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

function toApi(game) {
  const d = { ...game };
  if (d.platform && typeof d.platform === 'object') {
    d.platform = d.platform.name;
  }
  if (d.storage_device && typeof d.storage_device === 'object') {
    d.storage_device = d.storage_device.name;
  }
  if (d.genres && Array.isArray(d.genres)) {
    d.genres = [...d.genres];
  }
  return d;
}

function fromApi(game) {
  return { ...game };
}

export async function fetchGames(params = {}) {
  const qs = new URLSearchParams();
  if (params.limit) qs.set('limit', params.limit);
  if (params.offset) qs.set('offset', params.offset);
  if (params.search) qs.set('search', params.search);
  if (params.platform_id) qs.set('platform_id', params.platform_id);
  if (params.status) qs.set('status', params.status);
  if (params.genre_id) qs.set('genre_id', params.genre_id);
  const data = await request(`/api/games?${qs.toString()}`);
  return { ...data, items: data.items.map(fromApi) };
}

export async function fetchGame(id) {
  return fromApi(await request(`/api/games/${id}`));
}

export async function createGame(game) {
  return fromApi(await request('/api/games', {
    method: 'POST',
    body: JSON.stringify(toApi(game)),
  }));
}

export async function updateGame(id, game) {
  return fromApi(await request(`/api/games/${id}`, {
    method: 'PUT',
    body: JSON.stringify(toApi(game)),
  }));
}

export async function deleteGame(id) {
  return request(`/api/games/${id}`, { method: 'DELETE' });
}

export async function fetchGenres() {
  return request('/api/genres');
}

export async function fetchPlatforms() {
  return request('/api/platforms');
}

export async function fetchStorageDevices() {
  return request('/api/storage-devices');
}
