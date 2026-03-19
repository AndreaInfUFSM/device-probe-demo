export function buildSubmissionPayload(result, { appVersion, entryLabel = '' } = {}) {
  return {
    probeVersion: result?.meta?.version || '',
    appVersion: appVersion || '',
    sessionId: crypto.randomUUID(),
    entryLabel,
    origin: window.location.origin,
    pageUrl: window.location.href,
    timestamp: result?.meta?.timestamp || new Date().toISOString(),
    result,
  };
}

export async function sendProbePayload(endpoint, payload) {
  if (!endpoint || endpoint.includes('PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE')) {
    throw new Error('Configure apiEndpoint in config.js first.');
  }

  const body = new URLSearchParams({
    payload: JSON.stringify(payload),
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    body,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data?.ok) {
    throw new Error(data?.error || 'Backend returned ok=false.');
  }

  return data;
}