"""CutAI configuration settings."""

# Server
HOST = "0.0.0.0"
PORT = 8000

# Database
DATABASE_URL = "sqlite+aiosqlite:///./cutai.db"

# Ollama / LLM
OLLAMA_BASE_URL = "http://localhost:11434"
LLM_MODEL = "qwen2.5:7b"
LLM_NUM_CTX = 4096
LLM_TEMPERATURE = 0.7

# Stable Diffusion
SD_MODEL_ID = "runwayml/stable-diffusion-v1-5"
SD_WIDTH = 512
SD_HEIGHT = 512
SD_INFERENCE_STEPS = 25
SD_GUIDANCE_SCALE = 7.5
SD_NEGATIVE_PROMPT = "blurry, low quality, distorted, deformed, text, watermark"

# Paths
GENERATED_FRAMES_DIR = "generated/frames"

# CORS
ALLOWED_ORIGINS = [
    "http://localhost:5173",
]
