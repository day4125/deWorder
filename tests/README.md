# deworder-js tests

Browser-native test pages for the JS cleaner.

## Test pages

- `deworder.test.html` checks byte decoding, class detection, exact output for
  the stable verifier fixture, and focused cleanup edge cases.
- `production-smoke.html` accepts any Word-exported `.html` file via a file
  picker and checks the cleaned output for forbidden Word/browser artifacts.
  No fixture file is required — use any real document you have to hand.

Serve `js-deworder/` before opening the pages:

```sh
python3 -m http.server 8765
```

Then visit:

- `http://localhost:8765/tests/deworder.test.html`
- `http://localhost:8765/tests/production-smoke.html`

## Fixture strategy

Use exact output comparisons for small, stable fixtures. Use DOM- or
behavior-oriented checks for real Word exports, where parser/serializer
differences between cleaner runs are expected even when the cleaned content
is equivalent.
