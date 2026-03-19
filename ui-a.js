export function setRunningUI(els, isRunning, message = 'Realizando teste...') {
  els.runProbeBtn.disabled = isRunning;
  els.loaderWrap.classList.toggle('visible', isRunning);
  els.statusText.textContent = message;
}

export function setStatusText(els, message) {
  els.statusText.textContent = message;
}

export function showThanksModal(els) {
  els.thanksModal.showModal();
}