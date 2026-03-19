import { runProbe, buildApiPayload } from './probe.js';
import { renderResult, setLoading, showStatus } from './ui.js';

const state = {
  result: null,
};

const els = {
  runProbeBtn: document.getElementById('runProbeBtn'),
  showResultsBtn: document.getElementById('showResultsBtn'),
  copyJsonBtn: document.getElementById('copyJsonBtn'),
  spinner: document.getElementById('spinner'),
  statusText: document.getElementById('statusText'),
  tierValue: document.getElementById('tierValue'),
  browserValue: document.getElementById('browserValue'),
  memoryValue: document.getElementById('memoryValue'),
  benchValue: document.getElementById('benchValue'),
  resultsModal: document.getElementById('resultsModal'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  jsonOutput: document.getElementById('jsonOutput'),
  apiOutput: document.getElementById('apiOutput'),
  summaryPills: document.getElementById('summaryPills'),
  downloadJsonBtn: document.getElementById('downloadJsonBtn'),
};

async function handleRunProbe() {
  setLoading(els, true, 'Running test...');
  els.showResultsBtn.disabled = true;
  els.copyJsonBtn.disabled = true;

  try {
    const result = await runProbe((message) => setLoading(els, true, message));
    state.result = result;
    renderResult(els, result, buildApiPayload(result));
    setLoading(els, false, 'Test complete');
  } catch (error) {
    console.error(error);
    setLoading(els, false, `Test failed: ${error?.message || error}`);
  }
}

async function copyJson() {
  if (!state.result) return;
  await navigator.clipboard.writeText(JSON.stringify(state.result, null, 2));
  showStatus(els, 'JSON copied');
}

function downloadJson() {
  if (!state.result) return;
  const blob = new Blob([JSON.stringify(state.result, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'device-probe-result.json';
  a.click();
  URL.revokeObjectURL(url);
}

els.runProbeBtn.addEventListener('click', handleRunProbe);
els.showResultsBtn.addEventListener('click', () => els.resultsModal.showModal());
els.closeModalBtn.addEventListener('click', () => els.resultsModal.close());
els.copyJsonBtn.addEventListener('click', copyJson);
els.downloadJsonBtn.addEventListener('click', downloadJson);
