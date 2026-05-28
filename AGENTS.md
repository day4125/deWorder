# AGENTS.md

Guidance for maintaining the markdown docs in this repo.

## Scope rule

This is a **standalone static browser app**. Minimize network calls if it can be avoide.


## File roles

- **`README.md`** — short orientation: what the app is, file layout, how to
  run it locally. No history, no spec detail.
- **`PRD.md`** — product requirements and cleaner spec. Reads as a
  self-contained specification. Update when scope, defaults, allowed
  targets, or pipeline steps change.
- **`HANDOFF.md`** — pickup point for a fresh context. Current state,
  decisions already made, recommended next steps, fixture notes,
  verification notes. Update after any session that changes app behavior,
  decisions, or test coverage.
- **`CHANGELOG.md`** — append a new dated entry at the **top** for each
  user-visible change or notable internal change. Keep entries focused on
  the *why* and the *what changed*, not narration of the session.
- **`tests/README.md`** — how to run the browser test pages and the
  fixture strategy. Update when test pages or fixtures change.

## Changelog entries

- Newest entry first.
- Format: `## YYYY-MM-DD — Short title in sentence case`.
- One short paragraph minimum. Use sub-sections only when documenting a
  pipeline, mapping table, or list that would be unreadable as prose.
- Don't write "I did X" or "we then Y". Describe the change as it stands in
  the code now.
- Don't reference issue numbers, PRs, branches, or session context — there
  is no git history here yet.

## When you edit code, also

1. If you changed the cleaner pipeline, default mappings, allowed targets,
   disallowed tags, or stripped attrs → update `PRD.md` §3 and §5 and the
   relevant `CHANGELOG.md` entry.
2. If you changed app behavior, decisions, or test coverage → update
   `HANDOFF.md`.
3. If you changed how tests are run or added a new test page → update
   `tests/README.md`.
4. Add a new `CHANGELOG.md` entry at the top.

If a change touches none of those, you don't need to touch the docs.

## What not to do

- Don't re-introduce Python references when documenting parity, behavior,
  or history. Parity tests, if added, should compare JS output against
  checked-in expected fixture files, not against a live Python process.
- Don't add `allow-scripts`, `allow-forms`, or `allow-top-navigation` to the
  preview iframe sandbox.
- Don't create new top-level markdown files (e.g. `NOTES.md`, `TODO.md`,
  `ARCHITECTURE.md`) unless the user asks. The five existing docs
  (`README`, `PRD`, `HANDOFF`, `CHANGELOG`, `tests/README`) are the full
  set.
