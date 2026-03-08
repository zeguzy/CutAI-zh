"""VRAM Manager — ensures only ONE model occupies VRAM at any time.

RTX 3050 6GB cannot run LLM + SD simultaneously.
Ollama runs as a SEPARATE PROCESS — torch.cuda.empty_cache() does NOTHING
to free Ollama's VRAM. We MUST use Ollama's HTTP API with keep_alive=0.
"""

import gc
import httpx

from config import OLLAMA_BASE_URL, LLM_MODEL


class VRAMManager:
    """Singleton that orchestrates model loading/unloading for VRAM safety."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.current_model = None
            cls._instance.sd_pipeline = None
        return cls._instance

    async def load_llm(self):
        """Ensure LLM is ready. Unload SD first if loaded."""
        if self.current_model == "sd":
            await self.unload_sd()
        # Ollama auto-loads on first inference call
        self.current_model = "llm"

    async def load_sd(self):
        """Load Stable Diffusion pipeline. Unload LLM first if loaded."""
        if self.current_model == "llm":
            await self.unload_llm()
        # Actual SD pipeline loading happens in image_generator.py
        self.current_model = "sd"

    async def unload_llm(self):
        """Force-unload Ollama model from VRAM via HTTP API.

        CRITICAL: torch.cuda.empty_cache() does NOT work for Ollama.
        Ollama is a separate process — must use its HTTP API with keep_alive=0.
        """
        async with httpx.AsyncClient() as client:
            try:
                await client.post(
                    f"{OLLAMA_BASE_URL}/api/generate",
                    json={"model": LLM_MODEL, "keep_alive": 0},
                    timeout=30.0,
                )
            except httpx.ConnectError:
                pass  # Ollama not running, nothing to unload

        # Clean up any residual PyTorch allocations (from other models, not Ollama)
        gc.collect()
        try:
            import torch
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        except ImportError:
            pass  # torch not installed yet, that's fine

        self.current_model = None

    async def unload_sd(self):
        """Delete the diffusers pipeline and clear CUDA cache."""
        if self.sd_pipeline is not None:
            del self.sd_pipeline
            self.sd_pipeline = None

        gc.collect()
        try:
            import torch
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        except ImportError:
            pass

        self.current_model = None

    async def verify_vram_clear(self):
        """Debug helper: call nvidia-smi to confirm VRAM is freed."""
        import subprocess
        result = subprocess.run(["nvidia-smi"], capture_output=True, text=True)
        print(result.stdout)
        return result.stdout


# Module-level singleton
vram_manager = VRAMManager()
