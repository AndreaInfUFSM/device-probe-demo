const SHEET_NAME = 'probe_results';
const ALLOWED_ORIGINS = [
  // Example: 'https://yourusername.github.io'
  // Leave empty to allow all origins during early testing.
];

function doGet() {
  return jsonResponse({
    ok: true,
    service: 'device-probe-backend',
    message: 'POST probe payloads to this endpoint.',
    sheetName: SHEET_NAME,
  });
}


function extractPayload_(e) {
  if (!e) {
    throw new Error('Missing event object.');
  }

  // First: if Apps Script already parsed form fields, use that.
  if (e.parameter && e.parameter.payload) {
    return JSON.parse(e.parameter.payload);
  }

  // Second: try raw JSON body.
  const rawBody = e && e.postData && e.postData.contents ? e.postData.contents : '';
  if (rawBody) {
    try {
      return JSON.parse(rawBody);
    } catch (err) {
      throw new Error('Request body was not raw JSON and no form payload field was found.');
    }
  }

  throw new Error('No valid payload found.');
}



// function extractPayload_(e) {
//   const rawBody = e && e.postData && e.postData.contents ? e.postData.contents : '';
//   if (rawBody) {
//     try {
//       return JSON.parse(rawBody);
//     } catch (_) {
//       // ignore
//     }
//   }

//   if (e.parameter && e.parameter.payload) {
//     return JSON.parse(e.parameter.payload);
//   }

//   throw new Error('No valid JSON payload found.');
// }


function doPost(e) {
  try {
    const payload = extractPayload_(e);
    const validation = validatePayload(payload);

    if (!validation.ok) {
      return jsonResponse({ ok: false, error: validation.error });
    }

    const origin = getOriginFromPayload(payload);
    if (ALLOWED_ORIGINS.length > 0 && origin && !ALLOWED_ORIGINS.includes(origin)) {
      return jsonResponse({ ok: false, error: 'Origin not allowed.' });
    }

    const sheet = getOrCreateSheet_(SHEET_NAME);
    ensureHeader_(sheet);
    sheet.appendRow(buildRow_(payload));

    return jsonResponse({
      ok: true,
      message: 'Probe stored successfully.',
      receivedAt: new Date().toISOString(),
      probeVersion: payload.probeVersion || payload.result?.meta?.version || null,
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: String(error && error.message ? error.message : error),
    });
  }
}


// function doPost(e) {
//   try {
//     const rawBody = e && e.postData && e.postData.contents ? e.postData.contents : '';
//     if (!rawBody) {
//       return jsonResponse({ ok: false, error: 'Empty request body.' });
//     }

//     const payload = JSON.parse(rawBody);
//     const validation = validatePayload(payload);
//     if (!validation.ok) {
//       return jsonResponse({ ok: false, error: validation.error });
//     }

//     const origin = getOriginFromPayload(payload);
//     if (ALLOWED_ORIGINS.length > 0 && origin && !ALLOWED_ORIGINS.includes(origin)) {
//       return jsonResponse({ ok: false, error: 'Origin not allowed.' });
//     }

//     const sheet = getOrCreateSheet_(SHEET_NAME);
//     ensureHeader_(sheet);

//     const row = buildRow_(payload);
//     sheet.appendRow(row);

//     return jsonResponse({
//       ok: true,
//       message: 'Probe stored successfully.',
//       receivedAt: new Date().toISOString(),
//       probeVersion: payload.probeVersion || payload.result?.meta?.version || null,
//     });
//   } catch (error) {
//     return jsonResponse({
//       ok: false,
//       error: String(error && error.message ? error.message : error),
//     });
//   }
// }

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'Payload must be a JSON object.' };
  }

  if (!payload.result || typeof payload.result !== 'object') {
    return { ok: false, error: 'Missing result object.' };
  }

  const probeVersion = payload.probeVersion || payload.result?.meta?.version;
  const timestamp = payload.timestamp || payload.result?.meta?.timestamp;

  if (!probeVersion) {
    return { ok: false, error: 'Missing probeVersion.' };
  }

  if (!timestamp) {
    return { ok: false, error: 'Missing timestamp.' };
  }

  return { ok: true };
}

function getOriginFromPayload(payload) {
  return payload.origin || payload.app?.origin || null;
}

function getOrCreateSheet_(sheetName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  return sheet;
}

function ensureHeader_(sheet) {
  const headers = [
    'receivedAt',
    'probeVersion',
    'appVersion',
    'sessionId',
    'entryLabel',
    'origin',
    'pageUrl',
    'browserName',
    'browserVersion',
    'os',
    'osVersion',
    'formFactor',
    'engineName',
    'deviceMemoryGB',
    'hardwareConcurrency',
    'webGL',
    'webGPU',
    'mediaDevices',
    'camerasFound',
    'resizeAvgMs',
    'filterAvgMs',
    'canvasToBlobMs',
    'assignedTier',
    'modernizrLoaded',
    'bowserLoaded',
    'payloadJson',
  ];

  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const hasHeader = firstRow.some(Boolean);

  if (!hasHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
}

function buildRow_(payload) {
  const result = payload.result || {};
  const identity = result.identity || {};
  const hardware = result.hardware || {};
  const capabilities = result.capabilities || {};
  const benchmarks = result.benchmarks || {};
  const classification = result.classification || {};

  return [
    new Date(),
    payload.probeVersion || result.meta?.version || '',
    payload.appVersion || payload.app?.version || '',
    payload.sessionId || '',
    payload.entryLabel || '',
    payload.origin || payload.app?.origin || '',
    payload.pageUrl || payload.app?.pageUrl || '',
    identity.browserName || '',
    identity.browserVersion || '',
    identity.os || '',
    identity.osVersion || '',
    identity.formFactor || '',
    identity.engineName || '',
    hardware.deviceMemoryGB ?? '',
    hardware.hardwareConcurrency ?? '',
    capabilities.webGL ?? '',
    capabilities.webGPU ?? '',
    capabilities.mediaDevices ?? '',
    result.media?.camerasFound ?? '',
    benchmarks.resize?.avgMs ?? '',
    benchmarks.filter?.avgMs ?? '',
    benchmarks.canvasToBlob?.totalMs ?? '',
    classification.tier || '',
    capabilities.modernizrLoaded ?? '',
    capabilities.bowserLoaded ?? '',
    JSON.stringify(payload),
  ];
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
