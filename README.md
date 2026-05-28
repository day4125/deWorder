# deworder-js

Static browser-only HTML De-Worder.

Three-step workflow: upload or paste Word-exported HTML, map detected classes
to semantic targets, preview the cleaned body fragment, copy the source, and
download cleaned HTML. All processing happens in the browser.

## Current shape

```text
index.html              # static app shell
static/elements.html    # visual sampler for shared UI elements
static/style.css        # browser UI styles
static/defaults.js      # fallback config, allowed targets, pipeline constants
static/deworder.js      # decode, class detection, and cleanup API
static/app.js           # upload/paste, mapping, preview, copy, download UI
tests/fixtures/         # stable parity fixtures and expected output
tests/deworder.test.html
tests/production-smoke.html
```

## Running locally

Open `index.html` directly to run the app from local files, or serve this
directory from a static server:

```sh
python3 -m http.server 8765
```

- App: `http://localhost:8765/`
- Cleaner tests: `http://localhost:8765/tests/deworder.test.html`
- Production smoke: `http://localhost:8765/tests/production-smoke.html`

The app uses plain local scripts so double-clicking `index.html` works without
a server. The test pages still expect fixture files to be available over HTTP.
