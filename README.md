# Long Text Simplifier

A web application for simplifying long text using an AI completion API.

## Features

- Enter text into a web-based interface
- Simplify text using a configurable AI model
- Copy the simplified result to the clipboard
- Responsive and user-friendly design

## Setup

1. Install dependencies:

```bash
python -m pip install flask openai python-dotenv
```

2. Create a `.env` file in the project root and set your API values like this:

```env
BASE_URL=https://api.openai.com/v1
API_KEY=your_api_key_here
MODEL=gpt-4o-mini
```

3. Optionally edit `prompt.md` to change the simplification instruction.

## Run GUI App
```bash
python window.py
```

## Run the Web App

```bash
python app.py
```

Then open your browser and navigate to `http://localhost:5000`.

The interface includes:

- Input field to enter or paste text
- `Simplify` button to send the text to the API
- Output field displaying the simplified text
- `Copy` button to copy the simplified result to the clipboard
- `Clear` button to reset both input and output fields

## Project files

- `app.py` — Flask web server
- `window.py`- Desktop app built with tkinter
- `simplifier.py` — API client and simplification logic
- `templates/index.html` — web interface
- `static/css/index.css` — styling
- `static/js/index.js` — frontend functionality
- `prompt.md` — prompt template used during simplification
- `sample.txt` — example text for testing

## Notes

- Make sure `BASE_URL` and `API_KEY` are set before running the GUI app.
- The model selection box is provided in the web app to set up the model in an easier way.