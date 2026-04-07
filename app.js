// ─────────────────────────────────────────────────────────────
//  CALORIE LENS  —  app.js
//  Powered by OpenAI GPT-4o Vision
// ─────────────────────────────────────────────────────────────

// ▶ STEP 1: Paste your OpenAI API key here
//   Get one at: https://platform.openai.com/api-keys
const OPENAI_KEY = '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';

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function showErr(msg) {
  const el = $('err-box');
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => (el.style.display = 'none'), 5000);
}

// ─────────────────────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────────────────────
let imgB64  = '';
let imgType = 'image/jpeg';
let imgURL  = '';

// ─────────────────────────────────────────────────────────────
//  FILE / IMAGE LOADING
// ─────────────────────────────────────────────────────────────
function loadFile(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showErr('Please choose an image file (JPG, PNG, WEBP, etc.)');
    return;
  }
  imgURL = '';
  const reader = new FileReader();
  reader.onload = e => {
    const dataUrl = e.target.result;
    imgB64  = dataUrl.split(',')[1];
    imgType = file.type;
    $('scan-img').src = dataUrl;
    $('res-img').src  = dataUrl;
    analyze();
  };
  reader.readAsDataURL(file);
}

function loadURL(url) {
  if (!url) { showErr('Please enter an image URL.'); return; }
  if (!url.startsWith('http')) { showErr('Please enter a valid URL starting with http/https.'); return; }
  imgB64 = '';
  imgURL = url;
  $('scan-img').src = url;
  $('res-img').src  = url;
  analyze();
}

// ─────────────────────────────────────────────────────────────
//  EVENT LISTENERS
// ─────────────────────────────────────────────────────────────

// File input (click to browse)
$('file-inp').addEventListener('change', e => loadFile(e.target.files[0]));

// Camera input
$('cam-inp').addEventListener('change', e => loadFile(e.target.files[0]));
$('cam-btn').addEventListener('click', () => $('cam-inp').click());

// URL
$('url-go').addEventListener('click', () => loadURL($('url-inp').value.trim()));
$('url-inp').addEventListener('keydown', e => { if (e.key === 'Enter') $('url-go').click(); });

// Navigation
$('retry-btn').addEventListener('click', () => show('s-land'));
$('back-btn').addEventListener('click',  () => show('s-land'));

// Drag & drop
const dz = $('dropzone');
dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('over'); });
dz.addEventListener('dragleave', ()  => dz.classList.remove('over'));
dz.addEventListener('drop', e => {
  e.preventDefault();
  dz.classList.remove('over');
  const f = e.dataTransfer.files[0];
  if (f?.type.startsWith('image/')) loadFile(f);
});

// Paste anywhere (Ctrl+V / ⌘+V)
document.addEventListener('paste', e => {
  for (const item of (e.clipboardData?.items || [])) {
    if (item.type.startsWith('image/')) {
      loadFile(item.getAsFile());
      break;
    }
  }
});

// Tabs
document.querySelectorAll('.tab').forEach(t =>
  t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('on'));
    document.querySelectorAll('.panel').forEach(x => x.classList.remove('on'));
    t.classList.add('on');
    $('p-' + t.dataset.p).classList.add('on');
  })
);

// ─────────────────────────────────────────────────────────────
//  PROGRESS BAR ANIMATION
// ─────────────────────────────────────────────────────────────
function animProg(steps) {
  let i = 0;
  const bar = $('prog');
  const sub = $('an-sub');
  (function tick() {
    if (i >= steps.length) return;
    bar.style.width  = steps[i].p + '%';
    sub.textContent  = steps[i].t;
    const delay = steps[i].d || 900;
    i++;
    if (i < steps.length) setTimeout(tick, delay);
  })();
}

// ─────────────────────────────────────────────────────────────
//  MAIN ANALYSIS
// ─────────────────────────────────────────────────────────────
async function analyze() {
  show('s-analyze');

  animProg([
    { p: 10, t: 'Recognizing food…',          d: 600  },
    { p: 28, t: 'Checking image quality…',    d: 950  },
    { p: 52, t: 'Identifying ingredients…',   d: 1100 },
    { p: 74, t: 'Calculating nutrition data…',d: 1000 },
    { p: 90, t: 'Building your analysis…',    d: 700  },
    { p: 97, t: 'Almost there…',              d: 400  },
  ]);

  const PROMPT = `Analyze this food image carefully.

STEP 1 — Validation:
Is this a clear, recognizable food or dish photo?
• If NOT food, too blurry, or unidentifiable → respond ONLY with:
  {"valid":false,"reason":"brief reason here"}

STEP 2 — If valid food → respond ONLY with raw JSON (no markdown, no backticks, no explanation):
{
  "valid": true,
  "dish": "Full dish name",
  "cuisine": "Cuisine type",
  "calories": 650,
  "servings": "1 plate (400g)",
  "macros": { "carbs": 72, "protein": 34, "fat": 18 },
  "ingredients": [
    { "name": "Basmati Rice",  "amount": "180g", "calories": 234, "role": "base"    },
    { "name": "Chicken",       "amount": "150g", "calories": 215, "role": "protein" }
  ],
  "nutrition": [
    { "label": "Dietary Fiber", "value": "3.2g"   },
    { "label": "Sugar",         "value": "4.5g"   },
    { "label": "Sodium",        "value": "860mg"  },
    { "label": "Cholesterol",   "value": "78mg"   },
    { "label": "Saturated Fat", "value": "6g"     },
    { "label": "Potassium",     "value": "520mg"  },
    { "label": "Iron",          "value": "14% DV" },
    { "label": "Vitamin C",     "value": "9% DV"  }
  ],
  "recipe": [
    "Step 1 instruction",
    "Step 2 instruction",
    "Step 3 instruction",
    "Step 4 instruction",
    "Step 5 instruction",
    "Step 6 instruction"
  ]
}

Be accurate and specific to what you actually see in the image.`;

  // Build image content for OpenAI
  const imageContent = {
    type: 'image_url',
    image_url: {
      url:    imgURL || `data:${imgType};base64,${imgB64}`,
      detail: 'high'
    }
  };

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model:      'gpt-4o',
        max_tokens: 1500,
        messages: [{
          role:    'user',
          content: [imageContent, { type: 'text', text: PROMPT }]
        }]
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 401) {
        showInvalid('Invalid API key. Open app.js and replace YOUR_OPENAI_API_KEY_HERE with your real key from platform.openai.com');
      } else {
        showInvalid(`OpenAI API error (${res.status}): ${err.error?.message || 'Unknown error'}`);
      }
      return;
    }

    const data = await res.json();
    const raw  = data.choices?.[0]?.message?.content?.trim() || '';

    let json;
    try {
      json = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      showInvalid('Could not parse AI response. Please try again.');
      return;
    }

    if (!json.valid) {
      showInvalid(json.reason || 'Not a recognizable food image. Try a clearer photo.');
      return;
    }

    renderResult(json);
    setTimeout(() => show('s-result'), 350);

  } catch (err) {
    if (err.message?.includes('fetch') || err.name === 'TypeError') {
      showInvalid('Network error. Please check your internet connection and try again.');
    } else {
      showInvalid('Something went wrong. Please try again.');
    }
    console.error('[Calorie Lens]', err);
  }
}

function showInvalid(msg) {
  $('inv-msg').textContent = msg;
  show('s-invalid');
}

// ─────────────────────────────────────────────────────────────
//  RENDER RESULT
// ─────────────────────────────────────────────────────────────
function renderResult(d) {
  // Header
  $('res-name').textContent = d.dish     || 'Unknown Dish';
  $('res-meta').textContent = [d.cuisine, d.servings].filter(Boolean).join(' · ');

  // Calories
  $('res-cal').textContent = Math.round(d.calories);
  $('res-srv').textContent = d.servings || 'per serving';

  // Macros
  const { carbs = 0, protein = 0, fat = 0 } = d.macros;
  const total = carbs + protein + fat || 1;
  $('m-c').textContent = Math.round(carbs);
  $('m-p').textContent = Math.round(protein);
  $('m-f').textContent = Math.round(fat);

  // Animate macro bars after a short delay (post-render)
  setTimeout(() => {
    $('b-c').style.width = Math.round((carbs   / total) * 100) + '%';
    $('b-p').style.width = Math.round((protein / total) * 100) + '%';
    $('b-f').style.width = Math.round((fat     / total) * 100) + '%';
  }, 400);

  // Ingredients
  $('p-ingredients').innerHTML = (d.ingredients || []).map(i => `
    <div class="ing-row">
      <div>
        <div class="ing-n">${i.name}</div>
        <div class="ing-d">${i.amount}</div>
      </div>
      <div class="ing-r">
        <span class="ing-c">${Math.round(i.calories)} kcal</span>
        <span class="ing-tag">${i.role}</span>
      </div>
    </div>`).join('');

  // Nutrition
  $('p-nutrition').innerHTML = `<div class="nutr-grid">${
    (d.nutrition || []).map(n => `
      <div class="nutr-cell">
        <div class="nutr-lbl">${n.label}</div>
        <div class="nutr-val">${n.value}</div>
      </div>`).join('')
  }</div>`;

  // Recipe
  $('p-recipe').innerHTML = (d.recipe || []).map((s, i) => `
    <div class="step">
      <div class="step-n">${i + 1}</div>
      <div class="step-t">${s}</div>
    </div>`).join('');
}
