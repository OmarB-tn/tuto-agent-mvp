# Tuto — Vision-Guided Computer-Use Agent (MVP)

Jury-ready minimal source: a React HUD drives an autonomous FastAPI agent that
watches the screen, asks a local vision model for the next UI target, clicks it,
and streams each step back live.

## Architecture

```text
src/
  App.jsx                  Thin orchestrator (projects + chat layout)
  components/Sidebar.jsx   Project list, connection dot, new project
  components/ChatBot.jsx   Chat, file attach, live execution log, emergency stop
  hooks/useAgentSocket.js  Single WebSocket owner (protocol below)
  main.jsx / index.css     Entry + Tailwind v4 styles
backend/
  main.py                  FastAPI + /ws/agent loop + pyautogui execution
  llm_planner.py           Screenshot (mss) -> local VLM -> next {CLICK|DONE}
  requirements.txt         Python deps (incl. mss)
  .env.example             LOCAL_LLM_URL / VISION_MODEL_NAME
```

WebSocket protocol — client → server: `{ goal, files? }` or `{ action: "STOP" }`;
server → client: `{ action: "CLICK" | "DONE" | "STATUS" | "ERROR", text, x?, y? }`.

## Prerequisites

- Node 18+, Python 3.10+
- [Ollama](https://ollama.com) with a vision model, e.g. `ollama pull llava`

## Run (2 terminals)

```bash
# Terminal 1 — backend
cd backend
cp .env.example .env        # adjust if needed
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000

# Terminal 2 — frontend
npm install
npm run dev                 # open http://localhost:5173
```

Health check: `GET http://127.0.0.1:8000/health` → `{"status":"ok"}`.

## Demo script (60s)

1. Start backend + frontend, confirm green connection dot in Sidebar.
2. Click **New Project**, type a goal like `open the browser search box`.
3. Watch the **Live Agent Execution Log** stream `[CLICK] …` steps.
4. Press **EMERGENCY STOP** to cancel mid-run; send another goal to resume.
5. If the VLM is offline, the agent streams an `ERROR` fallback instead of clicking blindly.

## Safety

- `MAX_STEPS = 15` per goal, `pyautogui.FAILSAFE = True` (slam mouse to a corner to abort).
- `EMERGENCY STOP` sends `{ action: "STOP" }` and halts the loop.
- No screen data leaves the machine except to the configured `LOCAL_LLM_URL`.

## Scope / known limits

- MVP executes **clicks only** (no typing/scroll/drag yet).
- Single-goal loop; a new goal preempts the current one.
- Coordinates depend on VLM accuracy; low confidence still executes — tune per demo.
