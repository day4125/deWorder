# Expansion plan PRD

How to grow the current single-tool site (`html-deworder`) into a small
collection of browser-only utilities that share one visual identity, one
codebase, and one deployment.

## 1. Goal

Turn this repository from a single-purpose Word HTML cleaner into a
**static, browser-only toolbox**. The deworder becomes the first tool of
several; new tools (SVG viewer, text manipulators, color utilities) plug
into the same shell.

Constraints carried over from the current app:

- 100% static. No backend, no installer, no remote runtime CDNs.
- All processing happens locally in the browser. User data never leaves
  the machine.
- Each tool must work when `index.html` is opened directly from disk
  (`file://`), not only when served over HTTP.
- Preserve the existing terminal/monospace look and the Swedish UI voice
  as the house style.

## 2. Anticipated tools

Initial roster (concrete examples — not a closed list):

- **html-deworder** — the current tool. Cleans Word-exported HTML.
- **svg-viewer** — drop in / paste an SVG, inspect source, view rendered,
  copy minified or pretty-printed output, optionally adjust viewBox /
  fills.
- **text tools** — small single-purpose text manipulators (e.g. case
  conversion, whitespace normalization, diff, line sort/dedupe, slugify,
  JSON↔YAML, regex tester). Each lives as its own tool, not one
  mega-page.
- **color tools** — palette extractor, contrast checker, format converter
  (hex / rgb / hsl / oklch), color blender, gradient previewer.

All tools share the same shell, header, footer, color tokens, and step /
panel patterns. None of them require a build step.

## 3. Information architecture

### Home / index

`index.html` becomes a **landing page** that lists the available tools.
Each tool card shows: name, one-line tagline, and the same cursor /
terminal accent the current header uses.

The current deworder moves out of `index.html` into its own subpage so
the root URL is the directory.

### URL layout

```text
/                       → landing page (tool index)
/deworder/              → html-deworder
/svg-viewer/            → SVG viewer
/text/<tool>/           → text tools (case, sort, slugify, …)
/color/<tool>/          → color tools (palette, contrast, convert, …)
```

Each tool is a self-contained folder with its own `index.html` and its
own JS. The landing page is the only thing that must know about every
tool.

### File structure (target)

```text
js-deworder/                     # repo name kept for now; can rename later
  index.html                     # landing page
  static/
    shell.css                    # shared design tokens + layout primitives
    shell.js                     # shared header/footer + small helpers
    elements.html                # visual sampler for shared UI primitives
  tools/
    deworder/
      index.html
      app.js
      deworder.js
      defaults.js
      style.css                  # tool-specific overrides only
    svg-viewer/
      index.html
      app.js
      style.css
    text/
      case/
        index.html
        app.js
      sort/
        ...
    color/
      contrast/
        index.html
        app.js
      convert/
        ...
  tests/
    deworder/                    # existing deworder tests move here
    svg-viewer/
    ...
```

Rationale: each tool is independently openable, independently testable,
and can be deleted or copied without ripples. The shared layer is small
on purpose.

## 4. Shared design language

The current visual identity is the brand. Lock it in as the shell:

- **Color tokens** (already present in `static/style.css`):
  `--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--muted`,
  `--accent` (the green `#2f7a52`), `--accent-soft`, `--dim`.
- **Typography**: `ui-monospace` stack. No second font.
- **Header**: `$ tool-name` with the blinking cursor block. Tagline in
  `--muted`. Bottom border under the header.
- **Steps strip** (where applicable): numbered, lowercase, arrow
  separators, dot indicators. Reused by any tool that has a multi-step
  flow.
- **Panel / card** patterns: `.section`, `.row`, `.h2-row`, `.table-card`,
  the existing button hierarchy (primary / `.secondary` / `.link`).
- **Iconography**: hand-picked heroicons-style inline SVGs sized to
  `1em`. No icon-font dependency.

These move into `static/shell.css` as the canonical stylesheet. Tools
include `shell.css` first, then their own narrow override file if
needed.

### Shared header / footer

`static/shell.js` renders:

- the `$ tool-name` header with the cursor block,
- a small back-link to `/` on every tool subpage,
- optional footer with a one-line "kör helt i webbläsaren" privacy note.

Tools opt in by adding a `<header data-shell>` placeholder; the script
fills it. This keeps the no-build, no-framework promise.

## 5. Per-tool conventions

Every tool follows the same rules so users feel they are in one app:

1. **Step pattern (when applicable)**: a numbered `.steps` strip, one
   `.section` per step, the same button placement (`fortsätt →`,
   `återställ standardvärden`, `ladda upp annan fil`).
2. **Local-only**: no `fetch()` to the network. `localStorage`
   namespaced as `deworder-toolbox:<tool>:<key>` so tools cannot collide
   and a global reset is one prefix-scan.
3. **Sandboxed preview**: any rendering of user-supplied content goes
   into an iframe with `sandbox="allow-same-origin"` only. No
   `allow-scripts`, `allow-forms`, or `allow-top-navigation`.
4. **Output as fragment**: tools that produce code/text expose a copy
   button on the source view, matching the existing `.copy-btn` pattern.
5. **Swedish UI strings** as the default voice (`ladda upp`, `kopiera`,
   `återställ standardvärden`, …). New tools follow the same register.
6. **Tests**: each tool has a `tests/<tool>/<name>.test.html` page that
   can be opened directly. Fixtures live next to the test page.

## 6. Structural fixes to land before adding a second tool

These are issues in the current single-tool code that work fine today but
will fight us the moment a second tool exists. Fix in this order, ideally
as one PR with no behavior change, before the migration in §7.

1. **Scope the CSS.** `static/style.css` styles bare `button`, `p`,
   `code`, `html`, `body`, `svg`, `hr`, `table.mapping`, `pre.source`
   etc. Any second tool sharing this stylesheet will inherit deworder's
   assumptions. Split into:
   - `static/shell.css` — tokens (`--bg`, `--accent`, …) and primitives
     every tool wants (`body` font, base `button`, `.section`, `.steps`,
     `.row`, `.h2-row`, `.copy-btn`, `.secondary`, `.link`).
   - `tools/deworder/style.css` — deworder-only rules (`table.mapping`,
     `pre.source` tokenizer colors, `.drop-zone`, `.paste-wrap`,
     `.word-mascot`, etc.).

2. **Flip relative paths.** `index.html` and the tests reference
   `static/...` assuming the deworder lives at the root. Once it moves
   to `tools/deworder/`, every path becomes `../../static/...`. Cheaper
   to do this once now than after `config.json`, fixtures, and a second
   tool also assume root-relative paths.

3. **Pick a global-namespacing convention.** Today `window.Deworder` and
   `window.DeworderDefaults` are fine, but the pattern itself doesn't
   scale — every future tool exporting onto `window.<Tool>` adds a
   collision surface. Decide once:
   - either a single `window.Toolbox = { deworder: {...}, … }` namespace,
   - or move to ES modules (`<script type="module">`) and stop touching
     `window` at all. Modules still work from `file://` in evergreen
     browsers and are the cleaner long-term path.

4. **Scope DOM lookups to a tool root.** `#file-input`, `#drop-zone`,
   `#preview-meta`, `#copy-btn`, `#source-pre` are deworder-specific but
   read like they could belong to anything. Add `data-tool="deworder"`
   to `<main>`, and have `app.js` resolve a `root` once
   (`document.querySelector("[data-tool=deworder]")`) and run queries
   off that. Future shared `shell.js` injections won't collide, and two
   tools could in principle render on one page.

5. **Reconcile the `localStorage` doc/code mismatch.** `PRD.md` §2.5
   claims mappings and the strip-classes setting persist in
   `localStorage`. There is no `localStorage` call in `static/`. Either
   the doc is aspirational or the code regressed — decide before adding
   more tools, because whatever key shape ships first
   (`deworder:mapping` vs `toolbox:deworder:mapping`) gets copied by
   every future tool. The namespaced form is free to adopt now and
   painful to migrate later.

6. **Decide where the shared header markup lives.** The `$ tool-name` +
   cursor + tagline + bottom-border header is the brand and is currently
   inline HTML in `index.html`. Either accept copy-and-drift across two
   to three tools, or add a ~20-line `shell.js` that fills a
   `<header data-shell title="…" tagline="…">` placeholder. Lean toward
   `shell.js` only once the second tool actually exists — premature
   otherwise.

Explicitly **not** fixed in this pass: routing, build step, component
framework, generalized tool registry. Those are solutions to problems we
don't have yet.

Minimum useful subset if time is short: 1, 2, 4, 5. With those in place,
copying `tools/deworder/` to `tools/svg-viewer/` becomes the actual work
of adding a tool.

## 7. Migration plan for the current deworder

Done in small, reversible steps:

1. **Extract shell**: move shared tokens, header, steps strip, and
   button styles from `static/style.css` into `static/shell.css`. Keep
   deworder-specific rules in a thinner `static/style.css`. No
   functional change.
2. **Move deworder into a subfolder**: `index.html` →
   `tools/deworder/index.html`. Update relative paths to `../../static/...`.
   Tests move to `tests/deworder/`.
3. **Add a landing `index.html`** at the repo root that lists the
   deworder as the only available tool. The terminal header, cursor, and
   tagline pattern are reused verbatim.
4. **Namespace `localStorage`**: rename existing keys to the
   `deworder-toolbox:deworder:<key>` form, with a one-time migration that
   reads old keys and rewrites them.
5. **Document the shell** in `PRD.md` or a new `tools/README.md` so the
   next tool author has a checklist.

Steps 1–3 are mechanical and can land in a single PR; 4 should be its
own PR with a smoke test that previously saved preferences still load.

## 8. Non-goals (for the first expansion)

- No router, no SPA shell, no client-side history. Tools are real pages.
- No build step (no bundler, no TypeScript compile, no PostCSS). Plain
  HTML/CSS/JS only.
- No shared component framework (no React/Vue/Svelte). The shared layer
  is CSS + a tiny vanilla JS shell.
- No analytics, telemetry, or remote error reporting.
- No theme switcher in v1. The site is light-theme by design; revisit if
  multiple users ask.
- No account, login, or sync. `localStorage` is the only persistence.

## 9. Risks and open questions

- **Naming**: "html-deworder" is a tool name; the *site* needs a name.
  Options: keep the directory but show "verktygslåda" / "toolbox" on the
  landing page; or rebrand to something like `verktyg.se`-ish. Decide
  before the landing page ships.
- **Repo rename**: if the site name changes, decide whether to rename
  the GitHub repo or keep `js-deworder` as the historical slug.
- **Scope creep per tool**: text-tool category invites endless small
  utilities. Define a "is this worth a page?" bar — e.g. must be useful
  offline, must not be one regex.
- **Cross-tool linking**: should the SVG viewer link to the color-picker
  tool when you click a fill? Probably yes eventually, but only after we
  have two tools that overlap.
- **Accessibility audit**: the current app is keyboard-operable. Each
  new tool needs the same baseline — make it a checklist item, not an
  afterthought.
- **Docs sprawl**: the current `CLAUDE.md` caps the doc set at five
  markdown files. With multiple tools, each tool probably needs its own
  short `PRD.md` under `tools/<tool>/`. Update `CLAUDE.md` to allow
  per-tool docs explicitly.

## 10. Acceptance criteria for the expansion v1

- Opening `/` shows a landing page listing at least the deworder, in the
  shared visual language.
- The deworder still works exactly as before, served from
  `/deworder/`, opened from `file://`, and from the existing tests.
- A second tool (any of the anticipated ones) can be added by copying a
  template folder, editing its `index.html` and `app.js`, and adding one
  line to the landing page — no edits to other tools required.
- No tool makes a network request at runtime.
- `localStorage` keys are namespaced per tool; clearing one tool's
  preferences does not affect another.
