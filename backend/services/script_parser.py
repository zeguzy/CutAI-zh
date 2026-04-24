"""Script generation and parsing service.

Two-step pipeline:
  Step 1 — generate_script(): Free-form screenplay text (NO JSON constraint)
  Step 2 — parse_script_to_scenes(): LLM converts text → structured JSON (JSON mode)
"""

import json

from services.llm_client import chat_with_retry, chat_text_with_retry
from models.schemas import Script, MoodScore, SoundtrackVibe

# --- System prompts ---

SCRIPT_GENERATION_PROMPT = """你是 CutAI，一个创意编剧 AI。根据用户提供的类型和前提，生成短小精悍的剧本（3-7个场景）。

请使用标准剧本格式。每个场景应包含：
- 清晰的场景标题行（内景/外景. 地点 - 时间）
- 动作描述
- 角色对白（如有）
- 适合转化为分镜画面的视觉化场景

剧本控制在2页以内。注重视觉叙事，避免过多对白。
直接输出剧本正文，不要用 JSON 包裹。"""

SCRIPT_PARSING_PROMPT = """你是 CutAI，一位资深电影导演和摄影指导 AI。你分析剧本并将其拆解为详细的、可拍摄的场景，提供专业的逐镜头分解方案。

你必须且只能以符合指定 JSON 结构的合法 JSON 格式回复。不要使用 markdown、不要解释、不要前言，只返回纯 JSON。

对于每个场景，请像真正的导演一样思考：
- 选择服务于故事情感的摄影角度
- 变换镜头类型以创造视觉节奏
- 将情绪评分与叙事张力匹配
- 建议能增强氛围的配乐风格

关于 SD 提示词：请将其编写为针对 Stable Diffusion 1.5 优化的详细视觉描述。包含艺术风格、光影效果、色彩方案和构图。示例：「电影感全景镜头，灯光昏暗的爵士酒吧，暖琥珀色光效，烟雾缭绕，1940年代黑色电影美学，胶片颗粒感，35mm摄影」
"""

# --- JSON schema description for the LLM ---

SCRIPT_SCHEMA_DESCRIPTION = """{
  "title": "字符串，剧本标题",
  "genre": "字符串，类型",
  "logline": "字符串，一句话概述",
  "total_duration_seconds": 整数，
  "scenes": [
    {
      "scene_number": 整数,
      "title": "字符串，场景标题",
      "location": "字符串（如 内景. 咖啡馆 - 夜）",
      "time_of_day": "dawn|morning|afternoon|evening|night",
      "description": "字符串，场景完整描述",
      "characters": ["字符串"],
      "shots": [
        {
          "shot_number": 整数,
          "shot_type": "wide|close-up|medium|over-the-shoulder|POV|aerial|tracking",
          "camera_angle": "eye-level|low-angle|high-angle|dutch-angle|bird's-eye",
          "camera_movement": "static|pan-left|pan-right|tilt-up|tilt-down|dolly-in|dolly-out|crane",
          "description": "字符串，镜头内容描述",
          "dialogue": "字符串或null",
          "duration_seconds": 整数,
          "sd_prompt": "字符串，为 Stable Diffusion 1.5 优化的详细视觉提示词，包含艺术风格、光影、色彩方案"
        }
      ],
      "mood": {
        "tension": 浮点数（0.0-1.0），
        "emotion": 浮点数（0.0 悲伤 - 1.0 欢快），
        "energy": 浮点数（0.0 平静 - 1.0 紧张），
        "darkness": 浮点数（0.0 明亮 - 1.0 阴暗），
        "overall_mood": "字符串（melancholic|thrilling|romantic|eerie|triumphant|等）"
      },
      "soundtrack": {
        "genre": "字符串（ambient electronic|orchestral|lo-fi|jazz|synthwave|等）",
        "tempo": "slow|moderate|fast",
        "instruments": ["字符串"],
        "reference_track": "字符串（类似：艺术家 - 曲目）",
        "energy_level": 浮点数（0.0-1.0）
      },
      "frame_image_path": null
    }
  ]
}"""


def generate_script(genre: str, premise: str, num_scenes: int = 5) -> str:
    """Generate a raw screenplay from genre and premise via LLM.

    Step 1 of the two-step pipeline. Uses free-form text mode (no JSON
    constraint) so the LLM can write natural screenplay text.

    Returns:
        Raw screenplay text as a string.
    """
    messages = [
        {"role": "system", "content": SCRIPT_GENERATION_PROMPT},
        {
            "role": "user",
            "content": (
                f"请根据以下前提，写一个{genre}类型的剧本，包含{max(num_scenes - 1, 2)}个场景：\n\n"
                f"{premise}\n\n"
                f"请使用标准的场景标题行、动作描述和对白格式，输出完整剧本正文。"
            ),
        },
    ]
    return chat_text_with_retry(messages, retries=3)


def parse_script_to_scenes(script_text: str, genre: str = "drama") -> Script:
    """Parse raw script text into a fully structured Script with scenes, shots, mood, and soundtrack.

    Uses the LLM to analyze the script and produce structured output matching
    the Script Pydantic schema exactly.

    Args:
        script_text: The raw screenplay text to parse.
        genre: Genre hint for the LLM.

    Returns:
        A validated Script Pydantic model.
    """
    messages = [
        {"role": "system", "content": SCRIPT_PARSING_PROMPT},
        {
            "role": "user",
            "content": (
                f"分析以下{genre}类型剧本，将其拆解为详细的场景，并提供逐镜头分解方案。\n\n"
                f"剧本内容：\n{script_text}\n\n"
                f"请以单个 JSON 对象回复，严格匹配以下 schema：\n{SCRIPT_SCHEMA_DESCRIPTION}\n\n"
                f"要求：\n"
                f"- 每个场景至少包含2个镜头\n"
                f"- 每个镜头必须包含针对 Stable Diffusion 1.5 优化的 sd_prompt\n"
                f"- 所有情绪评分必须是 0.0 到 1.0 之间的浮点数\n"
                f"- 所有字段均为必填，dialogue 可以为 null\n"
                f"- frame_image_path 设为 null"
            ),
        },
    ]
    result = chat_with_retry(messages, retries=3)
    script = Script(**result)
    _fill_missing_defaults(script)
    return script


# --- Defaults for truncated LLM output ---

DEFAULT_MOOD = MoodScore(
    tension=0.5, emotion=0.5, energy=0.5, darkness=0.5, overall_mood="neutral"
)
DEFAULT_SOUNDTRACK = SoundtrackVibe(
    genre="ambient", tempo="moderate", instruments=["piano"],
    reference_track="N/A", energy_level=0.5,
)


def _fill_missing_defaults(script: Script) -> None:
    """Patch scenes where the LLM truncated mood/soundtrack fields."""
    for scene in script.scenes:
        if scene.mood is None:
            scene.mood = DEFAULT_MOOD.model_copy()
        if scene.soundtrack is None:
            scene.soundtrack = DEFAULT_SOUNDTRACK.model_copy()


def generate_and_parse(genre: str, premise: str, num_scenes: int = 5) -> Script:
    """Full pipeline: generate a script from premise, then parse into structured scenes."""
    script_text = generate_script(genre, premise, num_scenes)
    return parse_script_to_scenes(script_text, genre)
