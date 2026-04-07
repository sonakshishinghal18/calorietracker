# 🥗 Calorie Lens — AI Food Analyzer

Premium dark-theme food analysis web app powered by **OpenAI GPT-4o Vision**.

---

## 📁 Files
```
calorie-lens/
├── index.html   ← App structure & screens
├── style.css    ← Premium dark theme
├── app.js       ← All logic + OpenAI API
└── README.md
```

---

## 🚀 Setup (2 steps)

### Step 1 — Add your OpenAI API key
Open `app.js`, find **line 9**:
```js
const OPENAI_KEY = 'YOUR_OPENAI_API_KEY_HERE';
```
Replace with your key from → https://platform.openai.com/api-keys

### Step 2 — Deploy to GitHub Pages
1. Create a new GitHub repo (e.g. `calorie-lens`)
2. Upload all 4 files (`index.html`, `style.css`, `app.js`, `README.md`)
3. Go to **Settings → Pages → Branch: main → / (root) → Save**
4. Your app goes live at:
   ```
   https://YOUR_USERNAME.github.io/calorie-lens
   ```

---

## ✨ Features
| Feature | Details |
|---|---|
| 📸 Upload methods | Click to browse, drag & drop, paste (Ctrl+V / ⌘V), camera, image URL |
| 🤖 AI Model | OpenAI GPT-4o Vision |
| ✅ Image validation | Rejects non-food / blurry images with helpful message |
| 🔥 Calories | Total kcal with animated display |
| 📊 Macros | Carbs / Protein / Fat with animated progress bars |
| 🥦 Ingredients | Each item with amount, calories & role tag |
| 💊 Nutrition | Fiber, sugar, sodium, cholesterol, vitamins & more |
| 👨‍🍳 Recipe | Step-by-step cooking instructions |
| 🌑 Dark UI | Premium dark theme with orb animations & scan effect |

---

## ⚠️ API Key Security
For **personal / testing** use: putting the key in `app.js` is fine.

For a **public-facing app**: use a backend proxy so your key stays private:
- Cloudflare Worker
- Vercel Serverless Function
- Node.js / Express server

Store the key as an environment variable and have your frontend call your proxy endpoint instead of OpenAI directly.
