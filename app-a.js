import { config } from './config.js';
import { runProbe } from './probe.js';
import { buildSubmissionPayload, sendProbePayload } from './sender.js';
import { setRunningUI, setStatusText, showThanksModal } from './ui-a.js';

const els = {
  runProbeBtn: document.getElementById('runProbeBtn'),
  loaderWrap: document.getElementById('loaderWrap'),
  statusText: document.getElementById('statusText'),
  thanksModal: document.getElementById('thanksModal'),
  closeThanksBtn: document.getElementById('closeThanksBtn'),
};

function translateProgress(message) {
  const map = {
    'Checking browser details...': 'Verificando navegador...',
    'Checking browser capabilities...': 'Verificando recursos do navegador...',
    'Checking media and permissions...': 'Verificando permissões e recursos...',
    'Running mini-benchmarks...': 'Executando teste...',
  };
  return map[message] || 'Executando teste...';
}

async function handleRunProbe() {
  setRunningUI(els, true, 'Preparando teste...');

  try {
    const result = await runProbe((message) => {
      setRunningUI(els, true, translateProgress(message));
    });

    setStatusText(els, 'Enviando resultado...');

    const payload = buildSubmissionPayload(result, {
      appVersion: config.appVersion,
      entryLabel: '',
    });

    await sendProbePayload(config.apiEndpoint, payload);

    setRunningUI(els, false, 'Teste concluído');
    showThanksModal(els);
  } catch (error) {
    console.error(error);
    setRunningUI(els, false, 'Não foi possível concluir o teste.');
    alert('Não foi possível concluir o teste.');
  }
}

els.runProbeBtn.addEventListener('click', handleRunProbe);
els.closeThanksBtn.addEventListener('click', () => els.thanksModal.close());