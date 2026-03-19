import { config } from './config.js';
import { runProbe, buildApiPayload } from './probe.js';
import { buildSubmissionPayload, sendProbePayload } from './sender.js';
import { renderResult, setLoading, showStatus } from './ui.js';

const state = {
  result: null,
  submissionPayload: null,
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
  setLoading(els, true, 'Executando teste...');
  els.showResultsBtn.disabled = true;
  els.copyJsonBtn.disabled = true;

  try {
    const result = await runProbe((message) => setLoading(els, true, translateProgress(message)));
    state.result = result;

    const apiPayload = buildApiPayload(result);
    renderResult(els, result, apiPayload);
    setLoading(els, false, 'Teste concluído');

    if (config.sendEnabled) {
      showStatus(els, 'Enviando resultados...');
      const entryLabel = window.prompt('Identificação desta entrada (opcional):', '') ?? '';
      const submissionPayload = buildSubmissionPayload(result, {
        appVersion: config.appVersion,
        entryLabel,
      });
      state.submissionPayload = submissionPayload;
      await sendProbePayload(config.apiEndpoint, submissionPayload);
      showStatus(els, 'Resultados enviados');
    }
  } catch (error) {
    console.error(error);
    setLoading(els, false, `Falha: ${error?.message || error}`);
  }
}

async function copyJson() {
  if (!state.result) return;
  await navigator.clipboard.writeText(JSON.stringify(state.result, null, 2));
  showStatus(els, 'JSON copiado');
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

function translateProgress(message) {
  const map = {
    'Checking browser details...': 'Verificando navegador...',
    'Checking browser capabilities...': 'Verificando recursos do navegador...',
    'Checking media and permissions...': 'Verificando mídia e permissões...',
    'Running mini-benchmarks...': 'Executando pequenos testes de desempenho...',
  };
  return map[message] || message;
}

els.runProbeBtn.addEventListener('click', handleRunProbe);
els.showResultsBtn.addEventListener('click', () => els.resultsModal.showModal());
els.closeModalBtn.addEventListener('click', () => els.resultsModal.close());
els.copyJsonBtn.addEventListener('click', copyJson);
els.downloadJsonBtn.addEventListener('click', downloadJson);