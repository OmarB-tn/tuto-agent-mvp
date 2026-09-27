"""Tuto MVP backend — autonomous vision agent loop over WebSocket.

Flow per goal:
  1. Receive { goal, files? } from the React HUD.
  2. Loop (max MAX_STEPS): screenshot -> VLM (llm_planner) -> stream step to HUD.
  3. Execute CLICK with pyautogui, stop on DONE / STOP / disconnect.

Run:  uvicorn main:app --host 127.0.0.1 --port 8000
Requires: Ollama (or any OpenAI-compatible vision endpoint) — see .env.example.
"""

import asyncio
import json

import pyautogui
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from llm_planner import get_next_vision_step

pyautogui.FAILSAFE = True
pyautogui.PAUSE = 0.05

MAX_STEPS = 15
STEP_DELAY_SECONDS = 1.5

app = FastAPI(title="Tuto Agent MVP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.websocket("/ws/agent")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("HUD client connected")

    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                data = json.loads(raw_data)
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"action": "ERROR", "text": "Invalid JSON payload"}))
                continue

            # Emergency stop for the *current* goal loop is handled by
            # cancelling below; a bare STOP with no active loop is a no-op.
            if data.get("action") == "STOP" and not data.get("goal"):
                await websocket.send_text(json.dumps({"action": "STATUS", "text": "Agent idle"}))
                continue

            goal = data.get("goal", "").strip()
            if not goal:
                await websocket.send_text(json.dumps({"action": "ERROR", "text": "Empty goal, ignoring"}))
                continue

            print(f"Starting autonomous goal loop: {goal}")
            step_count = 0

            while step_count < MAX_STEPS:
                # Allow STOP to preempt the sleep between steps.
                try:
                    incoming = await asyncio.wait_for(websocket.receive_text(), timeout=STEP_DELAY_SECONDS)
                    stop = json.loads(incoming)
                    if stop.get("action") == "STOP":
                        await websocket.send_text(json.dumps({"action": "STATUS", "text": "Agent stopped by user"}))
                        break
                    # Any new goal preempts the current loop.
                    if stop.get("goal"):
                        goal = stop["goal"].strip()
                        print(f"Goal preempted, new goal: {goal}")
                        step_count = 0
                        continue
                except asyncio.TimeoutError:
                    pass  # No interruption — proceed with next step.

                step = await get_next_vision_step(goal)
                await websocket.send_text(json.dumps(step))

                if step.get("action") == "DONE":
                    break

                if step.get("action") == "CLICK" and "x" in step and "y" in step:
                    try:
                        pyautogui.click(step["x"], step["y"])
                    except Exception as exc:
                        await websocket.send_text(
                            json.dumps({"action": "ERROR", "text": f"Click failed: {exc}"})
                        )
                        break

                step_count += 1
            else:
                await websocket.send_text(
                    json.dumps({"action": "DONE", "text": f"Step limit ({MAX_STEPS}) reached, stopping"})
                )

    except WebSocketDisconnect:
        print("HUD client disconnected")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
