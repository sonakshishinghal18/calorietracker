# Calorie Lens — AI Food Analyzer

Premium dark-theme food analysis web app.
Frontend: HTML + CSS + JS
Backend: Python Flask → OpenAI GPT-4o Vision

## File Structure
```
calorie-lens/
├── index.html        ← Frontend UI
├── style.css         ← Premium dark theme
├── app.js            ← Frontend logic (calls Python backend)
├── server.py         ← Python backend (Flask + OpenAI)
├── requirements.txt  ← Python dependencies
└── README.md
```

## Setup & Run

### 1. Install dependencies
```
pip install -r requirements.txt
```

### 2. Add your OpenAI API key
Open server.py line 17, replace YOUR_OPENAI_API_KEY_HERE
Or set env var: export OPENAI_API_KEY=sk-...
Get key at: https://platform.openai.com/api-keys

### 3. Start the backend
```
python server.py
```
Runs at: http://localhost:5000

### 4. Open index.html in your browser
Done — upload a food photo and it will analyze!

## Deploy to Production

Backend: Deploy server.py to Railway / Render / Heroku / any VPS
Then update app.js line 9:
  const BACKEND_URL = "https://your-server.com/analyze";

Frontend: Host index.html + style.css + app.js on GitHub Pages / Netlify

## API Endpoint

POST /analyze

Body: { "image_base64": "...", "media_type": "image/jpeg" }
  or: { "image_url": "https://..." }

Response: JSON with dish, calories, macros, ingredients, nutrition, recipe
