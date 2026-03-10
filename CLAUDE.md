# CLAUDE.md — CutAI: AI Film Director & Storyboard Engine

## Project Identity

**CutAI** is a local-first AI film director tool that takes a short script (user-written or AI-generated), breaks it into scenes, generates shot-by-shot storyboards with AI-generated scene descriptions, camera angle suggestions, mood scores, and soundtrack vibes — all presented in a drag-and-drop visual storyboard editor. Think Figma meets screenplay software meets AI.

**Builder:** Swapnil  
**Portfolio Context:** Part of 100 Days of Vibe Coding. Joins LoreWeaver, Butterfly Effect Simulator, NEXUS, and JARVIS.

---

## Hardware Constraints (CRITICAL — Read Before Every Step)

- **GPU:** NVIDIA RTX 3050 6GB VRAM  
- **RAM:** 8GB DDR4  
- **OS:** Windows (dev machine)  
- **VRAM Rule:** LLM and Image Generation NEVER run simultaneously. Sequential pipeline only.  
  - Load Qwen 2.5 3B → generate ALL scene data → unload → load Stable Diffusion → generate ALL frames → unload  
- **LLM:** `qwen2.5:3b` via Ollama (~2GB VRAM, q4_K_M). Downgraded from 7B to 3B to avoid PSU power spikes on RTX 3050 during model load.
- **Image Gen:** Stable Diffusion 1.5 via `diffusers` (float16, ~3.5GB VRAM, 512×512)  
- **Max concurrent processes:** ONE model in VRAM at a time. No exceptions.
- **RAM Pressure Mitigation:** 8GB DDR4 is tight with Windows + dev tools + Ollama. Limit Ollama context window to `num_ctx=4096`. Close unnecessary Chrome tabs during generation. Qwen 2.5 3B loads primarily into VRAM (not system RAM) on CUDA, so it works — but monitor with Task Manager if you see slowdowns.

---

## Tech Stack

### Frontend
- **React 18** + **Vite** (fast dev server, HMR)
- **Tailwind CSS** (utility-first styling)
- **@dnd-kit/core** + **@dnd-kit/sortable** (drag-and-drop storyboard)
- **React Flow** (visual timeline/node graph)
- **Framer Motion** (animations, transitions)
- **Zustand** (lightweight state management)
- **Lucide React** (icons)

### Backend
- **FastAPI** (Python, async endpoints)
- **Pydantic v2** (structured LLM output parsing + validation)
- **SQLite** via **SQLAlchemy** + **aiosqlite** (async driver — REQUIRED for async SQLAlchemy with SQLite)
- **Ollama Python client** (`ollama` pip package) for local LLM
- **httpx** (async HTTP client for Ollama VRAM management API calls)
- **diffusers** + **torch** (Stable Diffusion 1.5, float16, CUDA)
- **Pillow** (image post-processing)
- **uvicorn** (ASGI server)

### Production Deployment (Later)
- **Frontend:** Vercel  
- **Backend:** Render  
- **LLM Swap:** Groq (`llama-3.1-8b-instant`) replaces local Ollama  
- **Image Gen Swap:** Replicate SDXL API or fal.ai replaces local SD  

---

## Project Structure

```
cutai/
├── CLAUDE.md                  # This file — the build bible
├── README.md                  # Portfolio README (written at Step 20)
├── .gitignore
│
├── backend/
│   ├── main.py                # FastAPI app entry point
│   ├── config.py              # Settings, model names, paths
│   ├── requirements.txt       # Key: fastapi, uvicorn, sqlalchemy, aiosqlite, ollama, httpx, 
│   │                           #      diffusers, torch, transformers, accelerate, pillow, pydantic
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── database.py        # SQLAlchemy engine, session, Base
│   │   ├── schemas.py         # Pydantic models (Script, Scene, Shot, MoodScore)
│   │   └── db_models.py       # SQLAlchemy ORM models
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── script_parser.py   # LLM-powered script → structured scenes
│   │   ├── scene_analyzer.py  # Camera angles, mood scores, soundtrack vibes
│   │   ├── image_generator.py # SD 1.5 storyboard frame generation
│   │   ├── llm_client.py      # Ollama wrapper with VRAM management
│   │   └── vram_manager.py    # Model loading/unloading orchestration
│   │
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── scripts.py         # CRUD for scripts
│   │   ├── scenes.py          # Scene generation & management
│   │   ├── storyboard.py      # Storyboard assembly & image gen
│   │   └── projects.py        # Project-level operations
│   │
│   └── generated/             # Output images (gitignored)
│       └── frames/
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   │
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       │
│       ├── stores/
│       │   ├── useProjectStore.js    # Zustand: project state
│       │   ├── useStoryboardStore.js # Zustand: scenes, shots, ordering
│       │   └── useUIStore.js         # Zustand: modals, panels, loading
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Header.jsx
│       │   │   ├── Sidebar.jsx
│       │   │   └── MainCanvas.jsx
│       │   │
│       │   ├── script/
│       │   │   ├── ScriptEditor.jsx       # Text input for scripts
│       │   │   └── ScriptGenerator.jsx    # AI script generation UI
│       │   │
│       │   ├── storyboard/
│       │   │   ├── StoryboardCanvas.jsx   # Main drag-and-drop area
│       │   │   ├── SceneCard.jsx          # Individual scene card
│       │   │   ├── ShotPanel.jsx          # Shot breakdown per scene
│       │   │   └── FramePreview.jsx       # AI-generated frame display
│       │   │
│       │   ├── timeline/
│       │   │   ├── VisualTimeline.jsx     # React Flow timeline
│       │   │   └── TimelineNode.jsx       # Custom node for timeline
│       │   │
│       │   ├── analysis/
│       │   │   ├── MoodGraph.jsx          # Mood score visualization
│       │   │   ├── CameraAngleTag.jsx     # Camera suggestion chips
│       │   │   └── SoundtrackPanel.jsx    # Soundtrack vibe suggestions
│       │   │
│       │   └── shared/
│       │       ├── LoadingSpinner.jsx
│       │       ├── Badge.jsx
│       │       └── Modal.jsx
│       │
│       ├── services/
│       │   └── api.js            # Axios/fetch wrapper for backend
│       │
│       └── utils/
│           ├── constants.js
│           └── helpers.js
│
└── docs/
    └── screenshots/              # For README
```

---

## Data Models (Pydantic Schemas)

These are the core data shapes flowing through the system. The LLM MUST output valid JSON matching these schemas.

```python
class Shot(BaseModel):
    shot_number: int
    shot_type: str          # "wide", "close-up", "medium", "over-the-shoulder", "POV", "aerial", "tracking"
    camera_angle: str       # "eye-level", "low-angle", "high-angle", "dutch-angle", "bird's-eye"
    camera_movement: str    # "static", "pan-left", "pan-right", "tilt-up", "tilt-down", "dolly-in", "dolly-out", "crane"
    description: str        # Visual description of what the shot shows
    dialogue: str | None    # Any dialogue in this shot
    duration_seconds: int   # Estimated duration
    sd_prompt: str          # Optimized prompt for Stable Diffusion image generation

class MoodScore(BaseModel):
    tension: float          # 0.0 - 1.0
    emotion: float          # 0.0 (sad) - 1.0 (joyful)
    energy: float           # 0.0 (calm) - 1.0 (intense)
    darkness: float         # 0.0 (light) - 1.0 (dark)
    overall_mood: str       # "melancholic", "thrilling", "romantic", "eerie", "triumphant", etc.

class SoundtrackVibe(BaseModel):
    genre: str              # "ambient electronic", "orchestral", "lo-fi", "jazz", "synthwave", etc.
    tempo: str              # "slow", "moderate", "fast"
    instruments: list[str]  # ["piano", "strings", "synth pad", "drums"]
    reference_track: str    # "Similar to: Hans Zimmer - Time"
    energy_level: float     # 0.0 - 1.0

class Scene(BaseModel):
    scene_number: int
    title: str
    location: str           # "INT. COFFEE SHOP - NIGHT"
    time_of_day: str        # "dawn", "morning", "afternoon", "evening", "night"
    description: str        # Full scene description
    characters: list[str]
    shots: list[Shot]
    mood: MoodScore
    soundtrack: SoundtrackVibe
    frame_image_path: str | None  # Path to generated storyboard frame

class Script(BaseModel):
    title: str
    genre: str
    logline: str            # One-sentence summary
    scenes: list[Scene]
    total_duration_seconds: int
```

---

## LLM Prompt Strategy

### Ollama Configuration (ALL LLM calls)
```python
# ALWAYS pass these options in every Ollama API call:
response = ollama.chat(
    model="qwen2.5:3b",
    messages=[...],
    format="json",       # Forces Ollama to output valid JSON — prevents markdown wrapping
    options={
        "num_ctx": 4096,  # Limit context window to reduce RAM pressure on 8GB system
        "temperature": 0.7,
    }
)
```

### JSON Response Cleaning (Defense Layer)
Even with `format="json"`, always run responses through a cleaner before Pydantic parsing:
```python
import re, json

def clean_json_response(text: str) -> dict:
    """Strip markdown fences, preamble, trailing text, and fix common issues."""
    # Remove markdown code fences
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    # Extract JSON object/array (first { to last } or first [ to last ])
    match = re.search(r'[\{\[]', text)
    if match:
        start = match.start()
        # Find matching closing bracket
        if text[start] == '{':
            end = text.rfind('}') + 1
        else:
            end = text.rfind(']') + 1
        text = text[start:end]
    # Fix trailing commas (common LLM mistake)
    text = re.sub(r',\s*([}\]])', r'\1', text)
    return json.loads(text)
```

### System Prompt for Script Parsing
```
You are CutAI, an expert film director and cinematographer AI. You analyze scripts and break them into detailed, filmable scenes with professional shot-by-shot breakdowns.

You MUST respond ONLY in valid JSON matching the provided schema. No markdown, no explanation, no preamble. Just pure JSON.

For each scene, think like a real director:
- Choose camera angles that serve the story's emotion
- Vary shot types to create visual rhythm
- Match mood scores to the narrative tension
- Suggest soundtrack vibes that enhance the atmosphere

For SD prompts: Write them as detailed visual descriptions optimized for Stable Diffusion 1.5. Include art style, lighting, color palette, composition. Example: "cinematic wide shot, dimly lit jazz bar, warm amber lighting, smoke haze, 1940s noir aesthetic, film grain, 35mm photography"
```

### System Prompt for Script Generation
```
You are CutAI, a creative screenwriter AI. Generate short, compelling scripts (3-7 scenes) based on the user's genre/premise.

Write in standard screenplay format. Each scene should have:
- A clear slug line (INT/EXT. LOCATION - TIME)
- Action descriptions
- Character dialogue (if any)
- Visual moments that translate well to storyboard frames

Keep scripts under 2 pages. Focus on visual storytelling over heavy dialogue.
Respond ONLY in valid JSON. No markdown, no preamble.
```

---

## VRAM Management Protocol

This is the most critical system in the entire app. Follow exactly.

```python
# vram_manager.py — Singleton pattern
import httpx, gc, torch

class VRAMManager:
    """
    Ensures only ONE model occupies VRAM at any time.
    RTX 3050 6GB cannot run LLM + SD simultaneously.
    
    CRITICAL: Ollama runs as a SEPARATE PROCESS. torch.cuda.empty_cache()
    does NOTHING to free Ollama's VRAM. You MUST use Ollama's HTTP API
    with keep_alive=0 to force-unload the model from VRAM.
    """
    current_model: str | None = None  # "llm" or "sd" or None
    sd_pipeline = None
    OLLAMA_BASE = "http://localhost:11434"
    
    async def load_llm(self):
        if self.current_model == "sd":
            await self.unload_sd()
        # Ollama auto-loads model on first inference call
        self.current_model = "llm"
    
    async def load_sd(self):
        if self.current_model == "llm":
            await self.unload_llm()
        # Load SD pipeline with float16, CUDA, attention + VAE slicing
        self.current_model = "sd"
    
    async def unload_llm(self):
        # CRITICAL: Use Ollama HTTP API to force-unload from VRAM
        # torch.cuda.empty_cache() does NOT work — Ollama is a separate process
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{self.OLLAMA_BASE}/api/generate",
                json={"model": "qwen2.5:3b", "keep_alive": 0}
            )
        # Now clean up any PyTorch residuals (for safety)
        gc.collect()
        torch.cuda.empty_cache()
        self.current_model = None
    
    async def unload_sd(self):
        # Delete the diffusers pipeline object, THEN clear CUDA cache
        if self.sd_pipeline is not None:
            del self.sd_pipeline
            self.sd_pipeline = None
        gc.collect()
        torch.cuda.empty_cache()
        self.current_model = None
    
    async def verify_vram_clear(self):
        """Debug helper: call nvidia-smi to confirm VRAM is freed."""
        import subprocess
        result = subprocess.run(["nvidia-smi"], capture_output=True, text=True)
        print(result.stdout)
```

### Pipeline Execution Order (ALWAYS)
1. User submits script (or requests generation)
2. `load_llm()` → Qwen 2.5 3B generates/parses scenes → `unload_llm()`
3. `load_sd()` → SD 1.5 generates frames for each scene → `unload_sd()`
4. Return complete storyboard to frontend

---

## 20-Step Build Order

> **RULE:** Commit to GitHub after EVERY step. Commit message format: `Step X: [description]`  
> **RULE:** Test each step before moving to the next.  
> **RULE:** If a step fails, fix it before proceeding. Never skip.

### Phase 1: Foundation (Steps 1–4)

**Step 1 — Project Scaffolding**
- Initialize git repo
- Create project structure (all folders, `__init__.py` files)
- Frontend: `npm create vite@latest frontend -- --template react` → install Tailwind, configure
- Backend: Create `requirements.txt`, `config.py`, `main.py` with health check endpoint
- **CORS (do this NOW, not later):** Add `CORSMiddleware` to `main.py` allowing origins `["http://localhost:5173"]`. Without this, every frontend fetch to the backend will be blocked by the browser. Don't wait until Step 19.
- Create `.gitignore` (node_modules, __pycache__, generated/, .env, venv/)
- Verify: Frontend runs on :5173, backend runs on :8000, `/health` returns OK, frontend can fetch `/health` without CORS error
- **Commit:** `Step 1: Project scaffolding — FastAPI + React + Vite + CORS`

**Step 2 — Database & Core Models**
- Implement `database.py` (SQLite + SQLAlchemy async engine)
  - **REQUIRED:** Install `aiosqlite` — Python's default sqlite3 driver is synchronous and will crash with async SQLAlchemy
  - Connection string MUST be: `sqlite+aiosqlite:///./cutai.db` (NOT `sqlite:///./cutai.db`)
- Implement `db_models.py` (Project, Script, Scene, Shot tables)
- Implement `schemas.py` (all Pydantic models from Data Models section above)
- Create + test DB initialization (tables auto-create on startup)
- Verify: App starts, tables created in `cutai.db`, no "sync driver" errors
- **Commit:** `Step 2: Database models and Pydantic schemas`

**Step 3 — LLM Client + VRAM Manager**
- Implement `llm_client.py` — wrapper around Ollama Python client for `qwen2.5:3b`
  - **CRITICAL:** Always pass `format="json"` in Ollama API calls to force JSON output mode
  - Add a `clean_json_response(text)` helper that:
    1. Strips markdown fences (` ```json ... ``` `)
    2. Strips any preamble text before the first `{` or `[`
    3. Strips any trailing text after the last `}` or `]`
    4. Fixes trailing commas before `}` or `]`
    5. Returns clean string ready for `json.loads()` → Pydantic
  - Set `num_ctx=4096` to limit context window and reduce RAM pressure on 8GB system
- Implement `vram_manager.py` — singleton with load/unload/swap logic (see VRAM Management Protocol above)
  - Ollama unload MUST use HTTP API: `POST /api/generate` with `{"model": "qwen2.5:3b", "keep_alive": 0}`
  - **DO NOT** rely on `torch.cuda.empty_cache()` to unload Ollama — it runs as a separate process
- Add `httpx` to requirements.txt (for async Ollama HTTP calls in VRAM manager)
- Test: Send a prompt to Qwen, get JSON response, verify VRAM clears after unload
- Verify: `ollama ps` shows no model loaded after unload
- **Commit:** `Step 3: LLM client with JSON mode and VRAM manager`

**Step 4 — Script Generation Service**
- Implement `script_parser.py` — two functions:
  1. `generate_script(genre, premise, num_scenes)` → raw script text from LLM
  2. `parse_script_to_scenes(script_text)` → structured `Script` Pydantic model
- Use system prompts from LLM Prompt Strategy section
- Add retry logic (up to 3 retries) for malformed JSON responses
- Add JSON repair: strip markdown fences, fix trailing commas
- Test: Generate a "noir thriller" script, verify all fields populated
- Verify: Output matches Pydantic schema exactly, no validation errors
- **Commit:** `Step 4: Script generation and parsing service`

### Phase 2: AI Pipeline (Steps 5–8)

**Step 5 — Scene Analysis Service**
- Implement `scene_analyzer.py`:
  1. `analyze_shots(scene)` → list of Shot objects with camera angles, movements
  2. `score_mood(scene)` → MoodScore object
  3. `suggest_soundtrack(scene, mood)` → SoundtrackVibe object
  4. `generate_sd_prompts(shots)` → optimized SD prompt per shot
- Each function = separate LLM call with focused system prompt
- Validate all outputs against Pydantic schemas
- Test: Feed a scene, get complete analysis with all fields
- **Commit:** `Step 5: Scene analysis — shots, mood, soundtrack`

**Step 6 — Image Generation Service**
- Implement `image_generator.py`:
  1. Load SD 1.5 pipeline (`runwayml/stable-diffusion-v1-5`, float16, CUDA)
  2. `generate_frame(sd_prompt, scene_id, shot_number)` → saves PNG to `generated/frames/`
  3. Configure: 512×512, 25 inference steps, guidance_scale=7.5
  4. VRAM optimizations (ALL THREE are required on 6GB):
     - `pipe.enable_attention_slicing()` — halves attention layer VRAM usage
     - `pipe.enable_vae_slicing()` — prevents VRAM spike during VAE decode (the final step where latents → image often causes OOM without this)
     - If still OOM: `pipe.enable_model_cpu_offload()` as last resort (slower but guaranteed to fit)
  5. Add negative prompt: "blurry, low quality, distorted, deformed, text, watermark"
- VRAM flow: vram_manager.unload_llm() → load SD → generate ALL frames → unload SD
- Test: Generate a frame from a prompt, verify image saved correctly
- Verify: VRAM clears after generation, `nvidia-smi` shows ~0 MB used
- **Commit:** `Step 6: Stable Diffusion 1.5 frame generation with VRAM optimization`

**Step 7 — Full Pipeline Orchestration**
- Create `routers/storyboard.py`:
  1. `POST /api/storyboard/generate` — takes script text OR genre+premise
  2. Orchestrates: parse script → analyze scenes → generate frames
  3. Returns complete storyboard JSON with image paths
  4. Add SSE (Server-Sent Events) for progress updates to frontend
- Pipeline stages with progress: "Parsing script..." → "Analyzing scene 1/5..." → "Generating frame 1/5..."
- Save all results to database
- Test: End-to-end — submit premise → get full storyboard with images
- **Commit:** `Step 7: Full storyboard generation pipeline with SSE progress`

**Step 8 — CRUD API Routes**
- Implement `routers/projects.py`: Create, list, get, delete projects
- Implement `routers/scripts.py`: Save, update, retrieve scripts
- Implement `routers/scenes.py`: Get scenes, update scene order, edit scene details
- Add `GET /api/storyboard/{project_id}/export` — returns complete storyboard JSON
- Serve generated images as static files: `/generated/frames/{filename}`
- Test: Full CRUD cycle via API (use httpie or curl)
- **Commit:** `Step 8: CRUD routes for projects, scripts, and scenes`

### Phase 3: Frontend Core (Steps 9–13)

**Step 9 — Layout Shell & Routing**
- Install all frontend deps: `@dnd-kit/core`, `@dnd-kit/sortable`, `reactflow`, `framer-motion`, `zustand`, `lucide-react`, `axios`
- Build layout: Header (logo + project name), Sidebar (navigation), MainCanvas (content area)
- Set up React Router: `/` (home/projects), `/project/:id` (storyboard editor)
- Design system: Pick a bold dark theme — think film editing software aesthetic
  - Dark background (#0a0a0f), accent colors (amber/warm gold for highlights)
  - Monospace font for screenplay text, clean sans-serif for UI
  - Film strip / clapperboard visual motifs
- Verify: Shell renders, navigation works, looks professional
- **Commit:** `Step 9: Frontend layout shell with dark film-editor aesthetic`

**Step 10 — Script Input & Generation UI**
- Build `ScriptEditor.jsx`: Textarea with screenplay-style formatting (monospace, caps for sluglines)
- Build `ScriptGenerator.jsx`: Genre dropdown, premise input, "Generate Script" button
- Connect to `POST /api/storyboard/generate` endpoint
- Add loading state with progress bar (consuming SSE events)
- Show real-time status: "Parsing script...", "Analyzing scenes...", "Generating frames..."
- Verify: Can type a script OR generate one, see progress, get results
- **Commit:** `Step 10: Script editor and AI generation UI with progress`

**Step 11 — Storyboard Canvas (Drag & Drop)**
- Build `StoryboardCanvas.jsx` using `@dnd-kit/core` + `@dnd-kit/sortable`
- Build `SceneCard.jsx`: Shows scene title, location, thumbnail frame, mood badge, duration
- Cards are draggable to reorder scenes
- Dropping a card updates scene order in Zustand store + API
- Grid layout: 3-4 cards per row, responsive
- Hover state: slight lift + glow effect (Framer Motion)
- Verify: Cards render from API data, drag-and-drop reorders, persists
- **Commit:** `Step 11: Drag-and-drop storyboard canvas`

**Step 12 — Shot Panel & Frame Preview**
- Build `ShotPanel.jsx`: Click a SceneCard → side panel slides in showing:
  - All shots in the scene (numbered, with type + angle badges)
  - Shot description text
  - AI-generated frame image (`FramePreview.jsx`)
  - Camera angle tag (color-coded: wide=blue, close-up=red, etc.)
  - Camera movement indicator (animated arrow icon)
- Framer Motion: Panel slides in from right, shots stagger-animate in
- Verify: Clicking a scene shows its shots, images load, panel animates
- **Commit:** `Step 12: Shot panel with frame preview and camera tags`

**Step 13 — Zustand Stores**
- Implement `useProjectStore.js`: current project, projects list, CRUD actions
- Implement `useStoryboardStore.js`: scenes array, shot data, scene ordering, selected scene
- Implement `useUIStore.js`: sidebar open/closed, active panel, loading states, modal state
- Wire all components to stores (replace any local state)
- Verify: State persists across navigation, no prop drilling
- **Commit:** `Step 13: Zustand state management wired to all components`

### Phase 4: Advanced Features (Steps 14–17)

**Step 14 — Visual Timeline (React Flow)**
- Build `VisualTimeline.jsx` using React Flow:
  - Each scene = a custom node (`TimelineNode.jsx`)
  - Nodes connected left-to-right in sequence
  - Node shows: scene number, title, duration, mood color (background tint)
  - Edges show transition type between scenes
- **State management pattern:** React Flow manages its OWN internal node/edge/position state. Zustand provides the scene DATA to React Flow as props. Use React Flow's `onNodesChange` and `onNodeClick` callbacks for one-way updates back to Zustand. DO NOT try to force two-way real-time sync between Zustand and React Flow — it causes infinite re-render loops.
- Color-code nodes by mood: warm/amber for happy, blue for sad, red for tense, purple for mysterious
- Clicking a timeline node selects that scene in the storyboard
- Synced with storyboard: reordering cards rebuilds React Flow nodes from Zustand scene array (one-way: Zustand → React Flow)
- Verify: Timeline renders, nodes clickable, syncs with storyboard state
- **Commit:** `Step 14: React Flow visual timeline synced with storyboard`

**Step 15 — Mood Graph & Analysis Panel**
- Build `MoodGraph.jsx` using Recharts:
  - X-axis: scenes in order
  - Y-axis: mood dimensions (tension, emotion, energy, darkness)
  - Line chart with 4 color-coded lines
  - Tooltip on hover showing exact scores
- Build `SoundtrackPanel.jsx`:
  - Per-scene soundtrack vibe card
  - Shows genre, tempo, instruments as tags, reference track
  - Visual: waveform-style decoration (CSS or SVG)
- Build `CameraAngleTag.jsx`: Pill badges with film-appropriate icons
- Verify: Graph renders with real data, soundtrack panel shows all fields
- **Commit:** `Step 15: Mood graph, soundtrack panel, and camera tags`

**Step 16 — Scene Editing & Regeneration**
- Add inline editing to SceneCard: click title/description to edit
- Add "Regenerate" button per scene: re-runs LLM analysis + SD frame for that scene only
- Add "Regenerate Frame" button: re-runs only SD with option to tweak the prompt
- Add manual SD prompt editing: user can modify the auto-generated prompt before regeneration
- Save edits to database via API
- Add "Add Scene" and "Delete Scene" buttons to storyboard
- Verify: Can edit, regenerate, add, delete scenes; changes persist
- **Commit:** `Step 16: Scene editing, regeneration, and manual prompt tweaks`

**Step 17 — Project Management**
- Build home page (`/`): Project gallery with cards
- Each card shows: project title, genre, scene count, last modified, thumbnail
- "New Project" button → modal with title + genre input
- "Delete Project" with confirmation modal
- "Duplicate Project" option
- Recent projects sorted by last modified
- Verify: Can create, list, open, delete projects from home page
- **Commit:** `Step 17: Project management home page`

### Phase 5: Polish & Ship (Steps 18–20)

**Step 18 — Export & Sharing**
- Add `GET /api/storyboard/{id}/export/json` — complete storyboard as downloadable JSON
- Add `GET /api/storyboard/{id}/export/pdf` — storyboard as PDF (use `reportlab` or `fpdf2`):
  - Each page: scene title, location, frame image, shots table, mood info
  - Professional film storyboard layout
- Frontend: Export dropdown with JSON + PDF options
- Add "Share" button that copies a summary to clipboard
- Verify: Both exports download correctly, PDF looks professional
- **Commit:** `Step 18: JSON and PDF storyboard export`

**Step 19 — Production Deployment Config**
- Add environment variable switching:
  - `LLM_PROVIDER=local|groq` (Ollama vs Groq API)
  - `IMAGE_PROVIDER=local|replicate` (SD local vs Replicate API)
- Add Groq client in `llm_client.py` (model: `llama-3.1-8b-instant`)
- Add Replicate client in `image_generator.py` (model: SDXL)
- **SD Prompt Strategy Switch:** SD 1.5 needs keyword-style prompts ("cinematic, 8k, masterpiece, trending on artstation") while SDXL needs natural language prompts. In `llm_client.py`, check `IMAGE_PROVIDER` and inject the matching system prompt for SD prompt generation so the LLM produces the right style.
- Frontend: `vite.config.js` with production API URL env var
- Add `Procfile` for Render, `vercel.json` for Vercel
- CORS configuration: expand allowed origins to include production domains (keep localhost for dev)
- Verify: App runs in both local and production configs
- **Commit:** `Step 19: Production deployment configuration`

**Step 20 — README & Portfolio Polish**
- Write comprehensive `README.md`:
  - Hero banner/screenshot
  - Project description + motivation
  - Tech stack with badges
  - Architecture diagram (Mermaid)
  - Setup instructions (local + production)
  - Screenshots of key features (storyboard, timeline, mood graph, export)
  - Hardware requirements
  - API documentation summary
  - Future roadmap
- Record a demo GIF or short video
- Final code cleanup: remove debug logs, unused imports, add docstrings
- **Commit:** `Step 20: README, portfolio polish, and final cleanup`

---

## Key Design Decisions

1. **Sequential VRAM pipeline** — Non-negotiable on 6GB. Never try to run LLM + SD together.
2. **SSE for progress** — Generation takes 30-60+ seconds. User must see real-time progress.
3. **Pydantic-first data flow** — Every LLM response is validated against schemas. Invalid = retry.
4. **SD prompts generated by LLM** — The LLM writes optimized SD prompts per shot. This is the bridge between text and image quality.
5. **Zustand over Redux** — Minimal boilerplate, perfect for this scale.
6. **Dark film-editor aesthetic** — This is a creative tool. It should FEEL like a film editing suite, not a generic SaaS dashboard.
7. **Local-first, cloud-ready** — Works fully offline on desktop, swaps to Groq + Replicate for deployment.

---

## Common Pitfalls to Avoid

- **DO NOT** load both models at once. You will OOM.
- **DO NOT** use `torch.cuda.empty_cache()` to unload Ollama models. Ollama is a separate process — you MUST use its HTTP API with `keep_alive=0`. `torch.cuda.empty_cache()` only cleans up PyTorch's own allocations (like Stable Diffusion).
- **DO NOT** skip JSON validation. Qwen outputs are good but not perfect — always validate + retry.
- **DO NOT** use `float32` for SD. Always `torch_dtype=torch.float16`.
- **DO NOT** forget VRAM optimizations for SD: `enable_attention_slicing()` + `enable_vae_slicing()`. Skip either and you risk OOM during VAE decode.
- **DO NOT** store generated images in the database. Store file paths only.
- **DO NOT** forget `format="json"` in Ollama API calls. Without it, the LLM wraps JSON in markdown fences.
- **DO NOT** use `sqlite:///` connection string with async SQLAlchemy. Must be `sqlite+aiosqlite:///`.
- **DO NOT** forget CORS middleware in Step 1. Frontend on :5173 cannot talk to backend on :8000 without it.
- **DO NOT** use localStorage in React artifacts — use Zustand stores.
- **DO NOT** try to two-way sync Zustand ↔ React Flow state. One-way: Zustand → React Flow props, React Flow callbacks → Zustand.
- **DO NOT** make the UI generic. This is a portfolio piece — it needs to look exceptional.

---

## Quick Reference Commands

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev

# Ollama
ollama run qwen2.5:3b          # Test LLM
ollama ps                       # Check loaded models
ollama stop qwen2.5:3b          # Unload from VRAM

# VRAM monitoring
nvidia-smi                      # Check GPU memory usage

# Git
git add -A && git commit -m "Step X: description"
git push origin main
```

---

## Resume After Break

If resuming mid-build:
1. Check last git commit to identify completed step
2. Read this CLAUDE.md fully
3. Run `nvidia-smi` to check VRAM state
4. Run backend + frontend to verify current state works
5. Proceed to next step

---

## Patch Log

**v1.1 — Gemini Stress Test Fixes (applied before build start)**

Patches applied after cross-model architecture review:

| # | Issue | Severity | Fix Applied |
|---|-------|----------|-------------|
| 1 | Ollama unload used `torch.cuda.empty_cache()` instead of HTTP API | **Critical** | VRAM Manager rewritten with `keep_alive=0` HTTP call |
| 2 | No CORS middleware for local dev | **Critical** | Added to Step 1 |
| 3 | Missing `aiosqlite` driver for async SQLAlchemy | **Critical** | Added to tech stack, Step 2, and requirements |
| 4 | No `format="json"` in Ollama calls | **High** | Added Ollama config section + JSON cleaner utility |
| 5 | Missing `enable_vae_slicing()` for SD | **High** | Added to Step 6 VRAM optimizations |
| 6 | SD 1.5 vs SDXL prompt style mismatch | **Medium** | Added provider-aware prompt switching to Step 19 |
| 7 | React Flow ↔ Zustand sync pattern unclear | **Medium** | Added one-way data flow pattern to Step 14 |
| 8 | RAM pressure on 8GB system undocumented | **Low** | Added `num_ctx=4096` limit + mitigation notes |

---

*Built with Claude Code (Opus 4.6) as part of 100 Days of Vibe Coding*  
*Architecture reviewed by Gemini — legitimate fixes incorporated, overblown concerns noted and dismissed*