# Calorie Lens — AI Food Analyzer

Stack: Python Flask backend + HTML/CSS/JS frontend
AI:    Anthropic Claude (claude-opus-4-5 vision)
Host:  Render

## Files
```
calorie-lens/
├── server.py         ← Flask backend + serves frontend
├── index.html        ← Frontend UI
├── style.css         ← Dark theme
├── app.js            ← Frontend logic
├── requirements.txt  ← Python deps (flask, httpx, gunicorn)
├── Procfile          ← Render/Heroku start command
├── render.yaml       ← Render auto-config
└── README.md
```

## Deploy to Render

1. Push all files to your GitHub repo

2. Go to render.com → New → Web Service → connect your repo

3. Set these in Render:
   - Build Command:  pip install -r requirements.txt
   - Start Command:  gunicorn server:app
   - Language:       Python 3

4. Add Environment Variable:
   - Key:   ANTHROPIC_API_KEY
   - Value: sk-ant-... (from console.anthropic.com/settings/api-keys)

5. Deploy — live at https://your-app.onrender.com

## Run Locally

  pip install -r requirements.txt
  export ANTHROPIC_API_KEY=sk-ant-...
  python server.py
  # Open http://localhost:5000

## Architecture

  Browser → POST /analyze → Flask → Anthropic Claude API → JSON → UI
  Flask also serves index.html / style.css / app.js as static files
  API key stays on server — never exposed to browser
