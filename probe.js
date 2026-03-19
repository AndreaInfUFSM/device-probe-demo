import { guessTier } from './tier.js';

function safeValue(value, fallback = null) {
  return value === undefined ? fallback : value;
}

function pause(ms = 120) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseBrowserInfo() {
  const parser = window.bowser && window.bowser.getParser
    ? window.bowser.getParser(window.navigator.userAgent)
    : null;

  const browser = parser ? parser.getBrowser() : {};
  const os = parser ? parser.getOS() : {};
  const platform = parser ? parser.getPlatform() : {};
  const engine = parser ? parser.getEngine() : {};

  return {
    userAgent: navigator.userAgent,
    browserName: browser.name || 'Unknown',
    browserVersion: browser.version || 'Unknown',
    os: os.name || 'Unknown',
    osVersion: os.versionName || os.version || null,
    formFactor: platform.type || 'unknown',
    platformVendor: platform.vendor || null,
    engineName: engine.name || null,
    engineVersion: engine.version || null,
    language: navigator.language,
    languages: navigator.languages || [],
    platform: safeValue(navigator.platform),
    cookieEnabled: safeValue(navigator.cookieEnabled),
    online: safeValue(navigator.onLine),
  };
}

function probeModernizrFeatures() {
  return {
    cookies: safeValue(window.Modernizr?.cookies, null),
    indexeddb: safeValue(window.Modernizr?.indexeddb, null),
    localstorage: safeValue(window.Modernizr?.localstorage, null),
    sessionstorage: safeValue(window.Modernizr?.sessionstorage, null),
    webgl: safeValue(window.Modernizr?.webgl, null),
    websockets: safeValue(window.Modernizr?.websockets, null),
    webworkers: safeValue(window.Modernizr?.webworkers, null),
    geolocation: safeValue(window.Modernizr?.geolocation, null),
    canvas: safeValue(window.Modernizr?.canvas, null),
    video: safeValue(window.Modernizr?.video, null),
    audio: safeValue(window.Modernizr?.audio, null),
    touch: safeValue(window.Modernizr?.touch, null),
    applicationcache: safeValue(window.Modernizr?.applicationcache, null),
    hashchange: safeValue(window.Modernizr?.hashchange, null),
    history: safeValue(window.Modernizr?.history, null),
    websocketsbinary: safeValue(window.Modernizr?.websocketsbinary, null),
  };
}

function getWebGLInfo() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return null;

    const debugExt = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = debugExt ? gl.getParameter(debugExt.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
    const renderer = debugExt ? gl.getParameter(debugExt.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    return { vendor, renderer };
  } catch {
    return null;
  }
}

function probeCoreCapabilities() {
  return {
    javascript: true,
    serviceWorker: 'serviceWorker' in navigator,
    localStorage: (() => {
      try {
        const key = '__probe_test__';
        localStorage.setItem(key, '1');
        localStorage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    })(),
    indexedDB: 'indexedDB' in window,
    webWorker: 'Worker' in window,
    sharedArrayBuffer: 'SharedArrayBuffer' in window,
    webAssembly: 'WebAssembly' in window,
    webGL: !!getWebGLInfo(),
    webGPU: 'gpu' in navigator,
    deviceMemoryExposed: 'deviceMemory' in navigator,
    hardwareConcurrencyExposed: 'hardwareConcurrency' in navigator,
    mediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    mediaRecorder: 'MediaRecorder' in window,
    permissionsApi: 'permissions' in navigator,
    connectionApi: 'connection' in navigator,
    modernizrLoaded: !!window.Modernizr,
    bowserLoaded: !!window.bowser,
  };
}

async function probeMedia() {
  const result = {
    mediaDevicesSupported: !!(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices),
    camerasFound: null,
    hasVideoInput: null,
    labelsAvailable: null,
    devices: [],
  };

  if (!result.mediaDevicesSupported) return result;

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter(d => d.kind === 'videoinput');
    result.camerasFound = videoInputs.length;
    result.hasVideoInput = videoInputs.length > 0;
    result.labelsAvailable = videoInputs.some(d => !!d.label);
    result.devices = videoInputs.map((d, index) => ({
      index,
      kind: d.kind,
      label: d.label || null,
      deviceIdExposed: !!d.deviceId,
      groupIdExposed: !!d.groupId,
    }));
  } catch (error) {
    result.error = String(error?.message || error);
  }

  return result;
}

function probeHardwareHints() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return {
    deviceMemoryGB: safeValue(navigator.deviceMemory),
    hardwareConcurrency: safeValue(navigator.hardwareConcurrency),
    maxTouchPoints: safeValue(navigator.maxTouchPoints),
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      pixelRatio: window.devicePixelRatio,
      orientationType: safeValue(window.screen.orientation?.type),
    },
    connection: connection ? {
      effectiveType: safeValue(connection.effectiveType),
      downlinkMbps: safeValue(connection.downlink),
      rttMs: safeValue(connection.rtt),
      saveData: safeValue(connection.saveData),
    } : null,
  };
}

async function probePermissions() {
  if (!('permissions' in navigator)) {
    return { supported: false };
  }

  const result = { supported: true };
  const names = ['camera', 'microphone', 'geolocation'];

  for (const name of names) {
    try {
      const status = await navigator.permissions.query({ name });
      result[name] = status.state;
    } catch {
      result[name] = 'unsupported';
    }
  }

  return result;
}

function createSyntheticImageData(width = 640, height = 640) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#1e293b');
  gradient.addColorStop(1, '#22c55e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = `rgba(${(i * 17) % 255}, ${(i * 37) % 255}, ${(i * 67) % 255}, 0.5)`;
    ctx.beginPath();
    ctx.arc((i * 37) % width, (i * 53) % height, (i % 16) + 10, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText('Probe', 32, 72);

  return { canvas, ctx };
}

function benchmarkResize(iterations = 6) {
  const source = createSyntheticImageData(1200, 1200).canvas;
  const target = document.createElement('canvas');
  target.width = 300;
  target.height = 300;
  const tctx = target.getContext('2d');

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    tctx.clearRect(0, 0, target.width, target.height);
    tctx.drawImage(source, 0, 0, target.width, target.height);
  }
  const end = performance.now();

  return {
    iterations,
    totalMs: +(end - start).toFixed(2),
    avgMs: +(((end - start) / iterations).toFixed(2)),
  };
}

function benchmarkFilter(iterations = 4) {
  const { canvas, ctx } = createSyntheticImageData(900, 900);
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let p = 0; p < data.length; p += 4) {
      const r = data[p];
      const g = data[p + 1];
      const b = data[p + 2];
      const brightness = (r + g + b) / 3;
      data[p] = Math.min(255, brightness * 1.04 + 6);
      data[p + 1] = Math.min(255, g * 1.02 + 4);
      data[p + 2] = Math.min(255, b * 0.98 + 3);
    }
    ctx.putImageData(imageData, 0, 0);
  }

  const end = performance.now();
  return {
    iterations,
    totalMs: +(end - start).toFixed(2),
    avgMs: +(((end - start) / iterations).toFixed(2)),
  };
}

function benchmarkCanvasToBlob() {
  return new Promise((resolve) => {
    const { canvas } = createSyntheticImageData(1000, 1000);
    const start = performance.now();
    canvas.toBlob((blob) => {
      const end = performance.now();
      resolve({
        totalMs: +(end - start).toFixed(2),
        blobBytes: blob ? blob.size : null,
      });
    }, 'image/jpeg', 0.9);
  });
}

export async function runProbe(progressCallback = () => {}) {
  const startedAt = performance.now();

  progressCallback('Checking browser details...');
  const identity = parseBrowserInfo();
  await pause();

  progressCallback('Checking browser capabilities...');
  const capabilities = probeCoreCapabilities();
  const modernizrFeatures = probeModernizrFeatures();
  const graphics = { webGL: getWebGLInfo() };
  const hardware = probeHardwareHints();
  await pause();

  progressCallback('Checking media and permissions...');
  const [media, permissions] = await Promise.all([
    probeMedia(),
    probePermissions(),
  ]);

  progressCallback('Running mini-benchmarks...');
  await pause();
  const resize = benchmarkResize();
  const filter = benchmarkFilter();
  const canvasToBlob = await benchmarkCanvasToBlob();

  const meta = {
    version: '0.2.0',
    timestamp: new Date().toISOString(),
    elapsedMs: +((performance.now() - startedAt).toFixed(2)),
  };

  const provisional = {
    meta,
    identity,
    capabilities,
    modernizrFeatures,
    graphics,
    hardware,
    media,
    permissions,
    benchmarks: { resize, filter, canvasToBlob },
  };

  return {
    ...provisional,
    classification: {
      tier: guessTier(provisional),
    },
  };
}

export function buildApiPayload(result) {
  return {
    timestamp: result.meta.timestamp,
    probeVersion: result.meta.version,
    browserName: result.identity.browserName,
    browserVersion: result.identity.browserVersion,
    os: result.identity.os,
    osVersion: result.identity.osVersion,
    formFactor: result.identity.formFactor,
    engineName: result.identity.engineName,
    deviceMemoryGB: result.hardware.deviceMemoryGB,
    hardwareConcurrency: result.hardware.hardwareConcurrency,
    webGL: result.capabilities.webGL,
    webGPU: result.capabilities.webGPU,
    mediaDevices: result.capabilities.mediaDevices,
    camerasFound: result.media.camerasFound,
    resizeAvgMs: result.benchmarks.resize.avgMs,
    filterAvgMs: result.benchmarks.filter.avgMs,
    canvasToBlobMs: result.benchmarks.canvasToBlob.totalMs,
    assignedTier: result.classification.tier,
    modernizrLoaded: result.capabilities.modernizrLoaded,
    bowserLoaded: result.capabilities.bowserLoaded,
    fullJson: JSON.stringify(result),
  };
}
