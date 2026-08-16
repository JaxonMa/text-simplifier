# AGENTS.md

Text simplifier: Flask web app + tkinter GUI, both calling an OpenAI-compatible chat API via `simplifier.py`.

## Setup

- Use the repo venv: `.venv` (Python 3.14). `openai` and `python-dotenv` are imported by `simplifier.py`/`window.py` but are NOT in `requirements.txt` (Flask-only) nor installed in `.venv`. Install them: `.venv/bin/pip install openai python-dotenv flask`
- Config via `.env` (gitignored; template is misspelled `.env.exapmle`): `BASE_URL`, `API_KEY`, `MODEL`. `simplifier.get_env_settings()` also reads `LOOP` (unused elsewhere).
- Run from the repo root only: `get_prompt()` opens `prompt.md` by relative path.
- GUI: `.venv/bin/python window.py` · Web: `.venv/bin/python app.py` (serves on port 5000, debug off). No tests, linters, or CI.

## Architecture / gotchas

- `simplifier.py` is the single API layer (`get_env_settings`, `get_prompt`, `simplify`); both frontends use it.
- The web app is incomplete: `static/js/index.js` POSTs JSON `{text, model, baseUrl, apiKey}` to `/api/simplify` and expects `{"simplified": ...}` or `{"result": ...}`, but `app.py` only defines `GET /` — the endpoint does not exist. Any web work starts here.
- Web config (incl. API key) lives in browser `localStorage`; input text autosaves to `sessionStorage`.
- `simplifier.py` `main()` reads `sample_text.txt`, but the repo file is `sample.txt` (CLI path is broken).
- `prompt.md` is the full system prompt sent to the model; edit it to change behavior.

## Conventions

- Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`).
- Python files start with `# -*- coding: utf-8 -*-` and `# SPDX-License-Identifier: MIT`.
