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
