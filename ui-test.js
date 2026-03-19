export function setLoading(els, isLoading, message = 'Waiting') {
  els.runProbeBtn.disabled = isLoading;
  els.spinner.classList.toggle('visible', isLoading);
  els.statusText.textContent = message;
}

export function showStatus(els, message) {
  els.statusText.textContent = message;
}

function escapeHtml(str) {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function renderResult(els, result, apiPayload) {
  els.jsonOutput.textContent = JSON.stringify(result, null, 2);
  els.apiOutput.textContent = JSON.stringify(apiPayload, null, 2);
  els.showResultsBtn.disabled = false;
  els.copyJsonBtn.disabled = false;

  els.tierValue.textContent = result.classification.tier;
  els.browserValue.textContent = `${result.identity.browserName} ${result.identity.browserVersion}`;
  els.memoryValue.textContent = result.hardware.deviceMemoryGB ? `${result.hardware.deviceMemoryGB} GB` : 'not exposed';
  els.benchValue.textContent = `${result.benchmarks.filter.avgMs} ms`;

  const pills = [
    `OS: ${result.identity.os}`,
    `Form: ${result.identity.formFactor}`,
    `WebGL: ${result.capabilities.webGL ? 'yes' : 'no'}`,
    `WebGPU: ${result.capabilities.webGPU ? 'yes' : 'no'}`,
    `Cameras: ${result.media.camerasFound ?? 'unknown'}`,
    `Resize avg: ${result.benchmarks.resize.avgMs} ms`,
    `Modernizr: ${result.capabilities.modernizrLoaded ? 'yes' : 'no'}`,
    `Bowser: ${result.capabilities.bowserLoaded ? 'yes' : 'no'}`,
  ];

  els.summaryPills.innerHTML = pills.map(text => `<span class="pill">${escapeHtml(text)}</span>`).join(' ');
}
