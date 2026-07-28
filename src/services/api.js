const getBaseUrl = () => `http://${window.location.hostname}:8000`;
const TIMEOUT_MS = 15000;

function absUrl(path) {
  if (!path || path.startsWith('http')) return path;
  return `${getBaseUrl()}${path}`;
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const url = `${getBaseUrl()}${path}`;
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      signal: controller.signal,
      ...options,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `Erro ${res.status} — ${res.statusText}`);
    }
    return res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Tempo limite excedido — servidor demorou a responder');
    }
    if (err.message === 'Failed to fetch' || err.message.includes('NetworkError')) {
      throw new Error('Servidor indisponível — verifique se o backend está rodando');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
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

function join(arr) {
  return Array.isArray(arr) && arr.length > 0 ? arr.join(',') : undefined;
}

function fromApi(game) {
  return {
    ...game,
    cover_url: absUrl(game.cover_url),
    background_url: absUrl(game.background_url),
  };
}

export async function fetchGames(params = {}) {
  const qs = new URLSearchParams();
  qs.set('_t', Date.now());
  if (params.limit) qs.set('limit', params.limit);
  if (params.offset) qs.set('offset', params.offset);
  if (params.search) qs.set('search', params.search);
  const status = join(params.status);
  if (status) qs.set('status', status);
  const platform = join(params.platform);
  if (platform) qs.set('platform', platform);
  const genre = join(params.genre);
  if (genre) qs.set('genre', genre);
  const hds = join(params.hds);
  if (hds) qs.set('hds', hds);
  const coop_type = join(params.coop_type);
  if (coop_type) qs.set('coop_type', coop_type);
  if (params.interest_min) qs.set('interest_min', params.interest_min);
  if (params.interest_max) qs.set('interest_max', params.interest_max);
  if (params.sort) qs.set('sort', params.sort);
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

export async function exportXlsx() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `${getBaseUrl()}/api/export/xlsx`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `Erro ${res.status} ao exportar planilha`);
    }
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'biblioteca_jogos.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Tempo limite excedido ao exportar');
    if (err.message === 'Failed to fetch' || err.message.includes('NetworkError')) throw new Error('Servidor indisponível — não foi possível exportar');
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchHltb(title) {
  return request(`/api/metadata/hltb?title=${encodeURIComponent(title)}`);
}

export async function batchCreateGames(games) {
  return request('/api/games/batch', {
    method: 'POST',
    body: JSON.stringify({ games: games.map(toApi) }),
  });
}
