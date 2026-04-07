# Calorie Lens — AI Food Analyzer

**Stack:** Python Flask backend + HTML/CSS/JS frontend  
**AI:** OpenAI GPT-4o Vision  
**Host:** Render (backend serves everything — one deployment, done)

---

## Files
```
calorie-lens/
├── server.py         ← Flask backend + serves frontend
├── index.html        ← Frontend UI
├── style.css         ← Dark theme
├── app.js            ← Frontend logic
├── requirements.txt  ← Python deps (flask, openai, gunicorn)
├── Procfile          ← Render/Heroku start command
├── render.yaml       ← Render auto-config
└── README.md
```

---

## Deploy to Render (recommended)

1. Push all files to your GitHub repo

2. Go to https://render.com → New → Web Service → connect your repo

3. Render auto-detects Flask. Use these settings:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn server:app`
   - **Language:** Python 3

4. Add environment variable:
   - Key:   `OPENAI_API_KEY`
   - Value: `sk-...` (your key from https://platform.openai.com/api-keys)

5. Click Deploy — your app is live at `https://calorietracker.onrender.com`

---

## Run Locally

```bash
# Install
pip install -r requirements.txt

# Set your OpenAI key (or edit server.py line 18)
export OPENAI_API_KEY=sk-...

# Start
python server.py

# Open browser
http://localhost:5000
```

---

## How It Works

```
Browser → POST /analyze → Flask (server.py) → OpenAI GPT-4o → JSON → Browser renders result
```

The Flask server does two things:
1. Serves index.html / style.css / app.js as static files
2. Proxies /analyze requests to OpenAI (API key stays on server, never exposed)
