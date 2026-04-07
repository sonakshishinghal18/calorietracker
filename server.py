"""
Calorie Lens — Python Backend (Flask)
Serves frontend files + proxies image analysis to Anthropic Claude.

Local:   python server.py
Render:  gunicorn server:app
"""

import os
import json
import httpx
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# ─────────────────────────────────────────────────────────────
#  CONFIG
#  On Render: set ANTHROPIC_API_KEY in Environment Variables tab
#  Locally:   export ANTHROPIC_API_KEY=sk-ant-...
# ─────────────────────────────────────────────────────────────
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
ANTHROPIC_URL     = "https://api.anthropic.com/v1/messages"
CLAUDE_MODEL      = "claude-sonnet-4-5"

app = Flask(__name__, static_folder=".", static_url_path="")
CORS(app)

PROMPT = """Analyze this food image carefully.

STEP 1 — Validation:
Is this a clear, recognizable food or dish photo?
If NOT food, too blurry, or unidentifiable respond ONLY with:
{"valid":false,"reason":"brief reason here"}

STEP 2 — If valid food respond ONLY with raw JSON, no markdown, no backticks:
{
  "valid": true,
  "dish": "Full dish name",
  "cuisine": "Cuisine type",
  "calories": 650,
  "servings": "1 plate (400g)",
  "macros": { "carbs": 72, "protein": 34, "fat": 18 },
  "ingredients": [
    { "name": "Basmati Rice", "amount": "180g", "calories": 234, "role": "base" },
    { "name": "Chicken",      "amount": "150g", "calories": 215, "role": "protein" }
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

Be accurate and specific to what you see in the image."""


# ── Serve frontend ────────────────────────────────────────────

@app.route("/")
def index():
    return send_from_directory(".", "index.html")

@app.route("/style.css")
def css():
    return send_from_directory(".", "style.css")

@app.route("/app.js")
def js():
    return send_from_directory(".", "app.js")


# ── Health check ─────────────────────────────────────────────

@app.route("/health")
def health():
    key_set = bool(ANTHROPIC_API_KEY and ANTHROPIC_API_KEY != "")
    return jsonify({
        "status": "ok",
        "model": CLAUDE_MODEL,
        "api_key_set": key_set
    })


# ── Analyze endpoint ─────────────────────────────────────────

@app.route("/analyze", methods=["POST"])
def analyze():

    # Guard: no API key configured
    if not ANTHROPIC_API_KEY:
        return jsonify({
            "error": "ANTHROPIC_API_KEY is not set. Add it in Render → Environment Variables."
        }), 500

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body"}), 400

    # Build Anthropic image content block
    if "image_url" in data:
        image_block = {
            "type": "image",
            "source": {
                "type": "url",
                "url": data["image_url"]
            }
        }
    elif "image_base64" in data:
        media_type = data.get("media_type", "image/jpeg")
        image_block = {
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": media_type,
                "data": data["image_base64"]
            }
        }
    else:
        return jsonify({"error": "Provide image_base64 or image_url"}), 400

    payload = {
        "model": CLAUDE_MODEL,
        "max_tokens": 1500,
        "messages": [{
            "role": "user",
            "content": [
                image_block,
                {"type": "text", "text": PROMPT}
            ]
        }]
    }

    headers = {
        "x-api-key":         ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type":      "application/json"
    }

    try:
        with httpx.Client(timeout=60.0) as client:
            response = client.post(ANTHROPIC_URL, json=payload, headers=headers)

        print(f"[Anthropic] status={response.status_code}")

        if response.status_code == 401:
            print(f"[AUTH ERROR] {response.text}")
            return jsonify({"error": "Invalid Anthropic API key. Check ANTHROPIC_API_KEY in Render → Environment."}), 401

        if response.status_code == 400:
            print(f"[BAD REQUEST] {response.text}")
            return jsonify({"error": f"Bad request: {response.text[:400]}"}), 400

        if response.status_code == 529:
            return jsonify({"error": "Anthropic is overloaded. Please try again shortly."}), 503

        if response.status_code != 200:
            print(f"[API ERROR {response.status_code}] {response.text}")
            return jsonify({"error": f"Anthropic error {response.status_code}: {response.text[:400]}"}), 500

        result = response.json()
        raw    = result["content"][0]["text"].strip()
        raw    = raw.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(raw)
        return jsonify(parsed)

    except json.JSONDecodeError as e:
        print(f"[JSON ERROR] {e}")
        return jsonify({"valid": False, "reason": "AI returned unexpected response. Please try again."}), 200
    except httpx.TimeoutException:
        return jsonify({"error": "Request timed out. Please try again."}), 504
    except Exception as e:
        print(f"[ERROR] {type(e).__name__}: {e}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print("=" * 50)
    print(f"  Calorie Lens  →  http://localhost:{port}")
    print(f"  Model: {CLAUDE_MODEL}")
    print(f"  API key set: {bool(ANTHROPIC_API_KEY)}")
    print("=" * 50)
    app.run(host="0.0.0.0", port=port, debug=False)
