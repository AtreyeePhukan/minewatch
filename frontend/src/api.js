/**
 * Centralised API client for MineWatch.
 * All backend communication goes through this module so the base URL lives
 * in one place rather than being scattered across components.
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function request(path, options) {
  const url = `${API_BASE_URL}${path}`;
  let response;
  try {
    response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch (err) {
    throw new Error(
      `Unable to reach the MineWatch backend at ${API_BASE_URL}. ` +
        'Please make sure the FastAPI server is running.',
    );
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body.detail) detail = body.detail;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail);
  }

  return response.json();
}

export function getHealth() {
  return request('/api/health', { method: 'GET' });
}

export function getSummary() {
  return request('/api/summary', { method: 'GET' });
}

export function getCharts() {
  return request('/api/charts', { method: 'GET' });
}

export function getSamples() {
  return request('/api/samples', { method: 'GET' });
}

export function predictSample(sampleIndex) {
  return request('/api/predict/sample', {
    method: 'POST',
    body: JSON.stringify({ sample_index: sampleIndex }),
  });
}

export function predictManual(features) {
  return request('/api/predict/manual', {
    method: 'POST',
    body: JSON.stringify(features),
  });
}

export { API_BASE_URL };
