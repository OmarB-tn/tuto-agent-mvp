"""Vision planner: screenshot -> local VLM -> next click target.

Runs against any OpenAI-compatible vision endpoint (default: Ollama).
Returns normalized coordinates; the caller converts to pixels and executes.
"""

import base64
import io
import json
import os

import mss
import pyautogui
from dotenv import load_dotenv
from openai import AsyncOpenAI
from PIL import Image

load_dotenv()

LOCAL_LLM_URL = os.getenv("LOCAL_LLM_URL", "http://localhost:11434/v1")
VISION_MODEL_NAME = os.getenv("VISION_MODEL_NAME", "llava")

client = AsyncOpenAI(base_url=LOCAL_LLM_URL, api_key="ollama")

PROMPT_TEMPLATE = """Analyze this screenshot for a virtual computer assistant.
Goal: {goal}

Find the most relevant UI element for the next step.

Return ONLY JSON:
{{
  "target": "name of element",
  "x": 0.0,
  "y": 0.0,
  "confidence": 0.0,
  "is_done": false
}}

x and y must be normalized coordinates from 0.0 to 1.0 relative to the full screenshot.
Set "is_done" to true ONLY if the user goal is fully accomplished on screen.
Do not describe the screen or explain reasoning.
"""


def capture_screen_base64() -> tuple[str, int, int]:
    """Capture the primary display and return (base64_jpeg, width, height)."""
    with mss.mss() as sct:
        monitor = sct.monitors[1]
        shot = sct.grab(monitor)
        img = Image.frombytes("RGB", shot.size, shot.bgra, "raw", "BGRX")

        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=80)
        encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return encoded, monitor["width"], monitor["height"]


def _strip_code_fences(content: str) -> str:
    if "```" in content:
        return content.split("```")[1].replace("json", "").strip()
    return content.strip()


async def get_next_vision_step(goal: str) -> dict:
    """Evaluate the current screen and return the single next action."""
    screen_w, screen_h = pyautogui.size()

    try:
        base64_img, screen_w, screen_h = capture_screen_base64()

        response = await client.chat.completions.create(
            model=VISION_MODEL_NAME,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": PROMPT_TEMPLATE.format(goal=goal)},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{base64_img}"},
                        },
                    ],
                }
            ],
            temperature=0.1,
        )

        content = _strip_code_fences(response.choices[0].message.content)
        data = json.loads(content)

        if data.get("is_done"):
            return {"action": "DONE", "text": "Goal accomplished!"}

        pixel_x = int(float(data.get("x", 0.5)) * screen_w)
        pixel_y = int(float(data.get("y", 0.5)) * screen_h)

        return {
            "action": "CLICK",
            "x": pixel_x,
            "y": pixel_y,
            "text": f"Clicking {data.get('target', 'UI element')} "
                    f"(conf={float(data.get('confidence', 0.0)):.2f})",
        }

    except Exception as exc:  # Local VLM offline -> safe fallback, no click
        print(f"Local LLM/Vision offline ({exc}). Returning fallback step.")
        return {
            "action": "ERROR",
            "x": int(screen_w * 0.5),
            "y": int(screen_h * 0.5),
            "text": f"Vision unavailable, waiting before retry for goal: '{goal}'",
        }
