# Device Probe Demo

Browser-based prototype for probing device and browser capabilities and sending the results to a Google Apps Script backend.

## What it does

- collects browser and OS information
- checks selected browser capabilities
- gathers a few device and hardware hints exposed by the browser
- runs small client-side benchmarks
- sends the result payload to a Google Apps Script web app
- stores submissions in a Google Sheet

## Main files

- `index.html` or other UI variants
- `app.js` UI flow
- `ui.js` UI helpers
- `probe.js` probe logic
- `tier.js` simple device tier classification
- `sender.js` payload building and submission
- `config.js` local configuration
- `apps-script-backend.gs` Google Apps Script backend

## Run locally

Serve the repository with a simple static server:

```bash
python -m http.server 8000
```

Then open `http://127.0.0.1:8000/`.

## Configure

Edit `config.js` and set your Apps Script web app URL in `apiEndpoint`.

## Backend

Attach `apps-script-backend.gs` to a Google Sheet through Apps Script and deploy it as a web app.

## Status

Prototype for testing and UI experimentation.