// ─────────────────────────────────────────────────────────────
//  CALORIE LENS  —  app.js
//  Uses relative URL /analyze — works locally AND on Render/any host
//  No API key here — it lives in server.py (set via env var on Render)
// ─────────────────────────────────────────────────────────────

const BACKEND_URL = "/analyze";   // relative — works everywhere

// ─────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

function show(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  $(id).classList.add("active");
  window.scrollTo({ top: 0, behavior: "instant" });
}

function showErr(msg) {
  const el = $("err-box");
  el.textContent = msg;
  el.style.display = "block";
  setTimeout(() => (el.style.display = "none"), 5000);
}

// STATE
let imgB64  = "";
let imgType = "image/jpeg";
let imgURL  = "";

// FILE LOADING
function loadFile(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) { showErr("Please choose an image file."); return; }
  imgURL = "";
  const reader = new FileReader();
  reader.onload = e => {
    const dataUrl = e.target.result;
    imgB64  = dataUrl.split(",")[1];
    imgType = file.type;
    $("scan-img").src = dataUrl;
    $("res-img").src  = dataUrl;
    analyze();
  };
  reader.readAsDataURL(file);
}

function loadURL(url) {
  if (!url) { showErr("Please enter an image URL."); return; }
  if (!url.startsWith("http")) { showErr("Please enter a valid http/https URL."); return; }
  imgB64 = "";
  imgURL = url;
  $("scan-img").src = url;
  $("res-img").src  = url;
  analyze();
}

// EVENTS
$("file-inp").addEventListener("change", e => loadFile(e.target.files[0]));
$("cam-inp").addEventListener("change",  e => loadFile(e.target.files[0]));
$("cam-btn").addEventListener("click",   () => $("cam-inp").click());
$("url-go").addEventListener("click",    () => loadURL($("url-inp").value.trim()));
$("url-inp").addEventListener("keydown", e => { if (e.key === "Enter") $("url-go").click(); });
$("retry-btn").addEventListener("click", () => show("s-land"));
$("back-btn").addEventListener("click",  () => show("s-land"));

const dz = $("dropzone");
dz.addEventListener("dragover",  e  => { e.preventDefault(); dz.classList.add("over"); });
dz.addEventListener("dragleave", () => dz.classList.remove("over"));
dz.addEventListener("drop", e => {
  e.preventDefault(); dz.classList.remove("over");
  const f = e.dataTransfer.files[0];
  if (f?.type.startsWith("image/")) loadFile(f);
});

document.addEventListener("paste", e => {
  for (const item of (e.clipboardData?.items || [])) {
    if (item.type.startsWith("image/")) { loadFile(item.getAsFile()); break; }
  }
});

document.querySelectorAll(".tab").forEach(t =>
  t.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("on"));
    document.querySelectorAll(".panel").forEach(x => x.classList.remove("on"));
    t.classList.add("on");
    $("p-" + t.dataset.p).classList.add("on");
  })
);

// PROGRESS
function animProg(steps) {
  let i = 0;
  const bar = $("prog"), sub = $("an-sub");
  (function tick() {
    if (i >= steps.length) return;
    bar.style.width = steps[i].p + "%";
    sub.textContent = steps[i].t;
    const delay = steps[i].d || 900;
    i++;
    if (i < steps.length) setTimeout(tick, delay);
  })();
}

// ANALYZE
async function analyze() {
  show("s-analyze");
  animProg([
    { p: 10, t: "Sending to server…",          d: 500  },
    { p: 28, t: "Checking image quality…",      d: 900  },
    { p: 52, t: "Identifying ingredients…",     d: 1100 },
    { p: 74, t: "Calculating nutrition data…",  d: 1000 },
    { p: 90, t: "Building your analysis…",      d: 700  },
    { p: 97, t: "Almost there…",                d: 400  },
  ]);

  const body = imgURL
    ? { image_url: imgURL }
    : { image_base64: imgB64, media_type: imgType };

  try {
    const res = await fetch(BACKEND_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body)
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      if (res.status === 401) {
        showInvalid("Invalid OpenAI API key. Set OPENAI_API_KEY in Render → Environment.");
      } else {
        showInvalid(data?.error || `Server error (${res.status}).`);
      }
      return;
    }

    if (!data) { showInvalid("Empty response. Please try again."); return; }
    if (!data.valid) { showInvalid(data.reason || "Not a recognizable food image."); return; }

    renderResult(data);
    setTimeout(() => show("s-result"), 350);

  } catch (err) {
    showInvalid("Cannot reach the server. Make sure server.py is running.");
    console.error("[Calorie Lens]", err);
  }
}

function showInvalid(msg) {
  $("inv-msg").textContent = msg;
  show("s-invalid");
}

// RENDER
function renderResult(d) {
  $("res-name").textContent = d.dish || "Unknown Dish";
  $("res-meta").textContent = [d.cuisine, d.servings].filter(Boolean).join(" · ");
  $("res-cal").textContent  = Math.round(d.calories);
  $("res-srv").textContent  = d.servings || "per serving";

  const { carbs = 0, protein = 0, fat = 0 } = d.macros;
  const total = carbs + protein + fat || 1;
  $("m-c").textContent = Math.round(carbs);
  $("m-p").textContent = Math.round(protein);
  $("m-f").textContent = Math.round(fat);

  setTimeout(() => {
    $("b-c").style.width = Math.round((carbs   / total) * 100) + "%";
    $("b-p").style.width = Math.round((protein / total) * 100) + "%";
    $("b-f").style.width = Math.round((fat     / total) * 100) + "%";
  }, 400);

  $("p-ingredients").innerHTML = (d.ingredients || []).map(i => `
    <div class="ing-row">
      <div><div class="ing-n">${i.name}</div><div class="ing-d">${i.amount}</div></div>
      <div class="ing-r">
        <span class="ing-c">${Math.round(i.calories)} kcal</span>
        <span class="ing-tag">${i.role}</span>
      </div>
    </div>`).join("");

  $("p-nutrition").innerHTML = `<div class="nutr-grid">${
    (d.nutrition || []).map(n => `
      <div class="nutr-cell">
        <div class="nutr-lbl">${n.label}</div>
        <div class="nutr-val">${n.value}</div>
      </div>`).join("")
  }</div>`;

  $("p-recipe").innerHTML = (d.recipe || []).map((s, i) => `
    <div class="step">
      <div class="step-n">${i + 1}</div>
      <div class="step-t">${s}</div>
    </div>`).join("");
}
