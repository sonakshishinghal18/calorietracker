"""
Calorie Lens — Python Backend (Flask)
Proxies image analysis requests to OpenAI GPT-4o Vision.

Setup:
  pip install flask flask-cors openai

Run:
  python server.py

The frontend talks to this backend at http://localhost:5000/analyze
"""

import os
import base64
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI

# ─────────────────────────────────────────────
#  CONFIG — paste your OpenAI key here
#  OR set environment variable: OPENAI_API_KEY
# ─────────────────────────────────────────────
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "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")

app = Flask(__name__)
CORS(app)  # Allow requests from the frontend

client = OpenAI(api_key=OPENAI_API_KEY)

PROMPT = """Analyze this food image carefully.

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

Be accurate and specific to what you actually see in the image."""


@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "Calorie Lens backend is running"})


@app.route("/analyze", methods=["POST"])
def analyze():
    """
    Accepts JSON body with ONE of:
      { "image_base64": "<base64 string>", "media_type": "image/jpeg" }
      { "image_url": "https://..." }
    Returns the GPT-4o analysis as JSON.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body"}), 400

    # Build the image content block for OpenAI
    if "image_url" in data:
        image_content = {
            "type": "image_url",
            "image_url": {"url": data["image_url"], "detail": "high"}
        }
    elif "image_base64" in data:
        media_type = data.get("media_type", "image/jpeg")
        data_url   = f"data:{media_type};base64,{data['image_base64']}"
        image_content = {
            "type": "image_url",
            "image_url": {"url": data_url, "detail": "high"}
        }
    else:
        return jsonify({"error": "Provide either image_base64 or image_url"}), 400

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            max_tokens=1500,
            messages=[{
                "role": "user",
                "content": [
                    image_content,
                    {"type": "text", "text": PROMPT}
                ]
            }]
        )

        raw = response.choices[0].message.content.strip()

        # Strip markdown fences if present
        raw = raw.replace("```json", "").replace("```", "").strip()

        # Parse and return JSON
        result = json.loads(raw)
        return jsonify(result)

    except json.JSONDecodeError:
        return jsonify({"valid": False, "reason": "AI returned an unexpected response. Please try again."}), 200
    except Exception as e:
        error_msg = str(e)
        print(f"[ERROR] {error_msg}")
        if "401" in error_msg or "Incorrect API key" in error_msg:
            return jsonify({"error": "Invalid OpenAI API key. Check your OPENAI_API_KEY in server.py"}), 401
        return jsonify({"error": f"Server error: {error_msg}"}), 500


if __name__ == "__main__":
    print("=" * 50)
    print("  Calorie Lens Backend")
    print("  Running at: http://localhost:5000")
    print("  Endpoint:   POST /analyze")
    print("=" * 50)
    app.run(host="0.0.0.0", port=5000, debug=True)
