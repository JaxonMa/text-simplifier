# Text Simplifier

A simple Python app for simplifying long text using an AI completion API.

## Features

- Paste or type long text into a resizable GUI
- Simplify text using a configurable AI model
- Copy the simplified result back to the clipboard
- Includes both a GUI mode and a CLI mode

## Setup

1. Install dependencies:

```bash
python -m pip install openai python-dotenv
```

2. Create a `.env` file in the project root and set your API values:

```env
BASE_URL=https://api.openai.com/v1
API_KEY=your_api_key_here
MODEL=gpt-4o-mini
LOOP=False
```
> Note: LOOP determines whether the commandline.py runs once or continuously.

3. Optionally edit `prompt.md` to change the simplification instruction.

## Run the GUI (Recommended)

```bash
python window.py
```

The GUI includes:

- `Paste` to load clipboard text
- `Simplify` to send the text to the API
- `Copy Simplified Text` to copy output back to the clipboard

The output pane also includes setup instructions by default.

## Run the CLI

```bash
python commandline.py
```

Enter text at the prompt, and the app will print a simplified version.

**Note**: The CLI has some issues unsolved. It may crash when processing long text. To have a better experience, please use the GUI version.

## Project files

- `commandline.py` — command-line entry point
- `window.py` — Tkinter GUI window implementation
- `simplifier.py` — API client and simplification logic
- `prompt.md` — prompt template used during simplification
- `sample.txt` — example text for testing

## Notes

- Make sure `BASE_URL` and `API_KEY` are set before running the app.
- The GUI is designed with responsive vertical layout and clipboard actions.
