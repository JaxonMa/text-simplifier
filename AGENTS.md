# AGENTS.md

Text simplifier: Flask web app + tkinter GUI, both calling an OpenAI-compatible chat API via `simplifier.py`.

## Setup

- Use the repo venv: `.venv` (Python 3.14). `openai` and `python-dotenv` are imported by `simplifier.py`/`window.py` but are NOT in `requirements.txt` (Flask-only) nor installed in `.venv`. Install them: `.venv/bin/pip install openai python-dotenv flask`
- Config via `.env` (gitignored; template is misspelled `.env.exapmle`): `BASE_URL`, `API_KEY`, `MODEL`.
- Run from the repo root only: `get_prompt()` opens `prompt.md` by relative path.
- GUI: `.venv/bin/python window.py` · Web: `.venv/bin/python app.py` (serves on port 5000, debug off). No tests, linters, or CI.

## Architecture / gotchas

- `simplifier.py` is the single API layer (`get_env_settings`, `get_prompt`, `simplify`); both frontends use it.
- The web frontend is split into `static/js/animations.js` (animations/visual feedback) and `static/js/logic.js` (state, config, backend calls). It talks to `POST /api/submit-model-config` (JSON `{base_url, model, api_key}`) and `POST /api/simplify-text/<original_text>`; both reply `{"status", "type", "message"}`.
- Web config (incl. API key) lives in browser `localStorage`; input text autosaves to `sessionStorage`.
- `prompt.md` is the full system prompt sent to the model; edit it to change behavior.

## Conventions

- Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`).
- Python files start with `# -*- coding: utf-8 -*-` and `# SPDX-License-Identifier: MIT`.

## Style

The web UI follows the **Graphite** design system, documented in `style/design-guide.md` (tokens, typography, and per-control rules live there). Any style change must conform to it:

- **Monochrome palette only** — use the color tokens from the guide's §2, and every light-mode rule must ship a matching `[data-theme="dark"]` override.
- **Sharp corners** — no `border-radius` on boxes, buttons, badges, or bubbles.
- **Hairline separators** — 1px borders (`#e5e5e5` light / `#3f3f45` dark); no shadows or elevation.
- **Micro-typography labels** — uppercase + letter-spaced labels at 12–13px; body text stays 14px.
- **Icons** — 18px stroke SVGs (`stroke-width: 1.8`, round caps/joins, `fill: none`, `stroke: currentColor`).
- **Interaction states** — hover inverts foreground/background (or uses the subtle-fill hover for badge-like controls); disabled dims and suppresses hover; success swaps the icon for a `✓`, loading swaps it for a spinner.
- **Contained scrolling** — long text scrolls inside the control (`overflow` + `min-height: 0`); nothing grows to fit content.
- **Theme parity** — dark mode must mirror light mode's structure, spacing, and motion exactly.

