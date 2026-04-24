"""Scene analysis service — shots, mood scoring, soundtrack vibes, SD prompts.

Each function makes a separate, focused LLM call to Qwen 2.5 7B via Ollama.
All outputs are validated against Pydantic schemas before returning.
"""

from config import IMAGE_PROVIDER
from models.schemas import Shot, MoodScore, SoundtrackVibe
from services.llm_client import chat_with_retry


# ---------------------------------------------------------------------------
# System prompts — one per function for focused, high-quality output
# ---------------------------------------------------------------------------

SHOT_ANALYSIS_PROMPT = """\
你是 CutAI，一位资深摄影指导。根据场景描述，制定专业的逐镜头拍摄方案。

请像真正的导演一样思考：
- 变换镜头类型以创造视觉节奏（全景→中景→特写等）
- 选择服务于故事情感的摄影角度
- 选择能增强叙事张力的摄影机运动方式
- 为每个镜头撰写生动的视觉描述
- 包含该镜头中的对白内容

shot_type 必须是以下之一：wide, close-up, medium, over-the-shoulder, POV, aerial, tracking
camera_angle 必须是以下之一：eye-level, low-angle, high-angle, dutch-angle, bird's-eye
camera_movement 必须是以下之一：static, pan-left, pan-right, tilt-up, tilt-down, dolly-in, dolly-out, crane

只返回合法 JSON，不要使用 markdown，不要解释。"""

MOOD_SCORING_PROMPT = """\
你是 CutAI，一位资深电影分析专家。根据场景描述，从四个维度对其情绪进行评分。请深入思考场景的情感暗流。

返回一个 JSON 对象，包含：
- tension: 浮点数，0.0（松弛）到 1.0（最大张力）
- emotion: 浮点数，0.0（极度悲伤）到 1.0（欢快）
- energy: 浮点数，0.0（平静/静止）到 1.0（激烈/混乱）
- darkness: 浮点数，0.0（明亮/轻松）到 1.0（阴暗/沉重）
- overall_mood: 一个词或短语（如「忧郁」「惊悚」「浪漫」「诡异」「壮烈」「苦甜参半」「不祥」）

只返回合法 JSON，不要使用 markdown，不要解释。"""

SOUNDTRACK_PROMPT = """\
你是 CutAI，一位资深电影配乐总监。根据场景描述及其情绪特征，建议能增强氛围的配乐风格。

返回一个 JSON 对象，包含：
- genre: 音乐类型（如「氛围电子」「管弦乐」「Lo-Fi」「爵士」「合成器浪潮」「后摇」「古典钢琴」）
- tempo: "slow"、"moderate" 或 "fast"
- instruments: 核心乐器数组（如 ["钢琴", "弦乐", "合成器pad", "鼓"]）
- reference_track: 真实参考曲目，格式为「类似：艺术家 - 曲目」
- energy_level: 浮点数，0.0（安静/氛围）到 1.0（强劲/震撼）

只返回合法 JSON，不要使用 markdown，不要解释。"""

SD_PROMPT_SD15 = """\
你是 CutAI，一位专精于 Stable Diffusion 1.5（512x512）图像生成提示词编写的专家。

根据给定的镜头描述列表，将每个镜头的 sd_prompt 改写为高度详细的视觉提示词。包含：
- 艺术风格与媒介（电影感、胶片颗粒、35mm摄影、数字艺术）
- 光影效果（戏剧性阴影、黄金时刻、霓虹光晕、柔和漫射光）
- 色彩方案（暖琥珀色调、冷蓝钢色、柔和粉彩）
- 构图提示（三分法、居中、引导线）
- 氛围元素（烟雾、雨、尘粒、雾）

使用关键词式提示词并加入质量增强词：「cinematic, 8k, masterpiece, trending on artstation, highly detailed, photorealistic」。

不要包含角色名称——改为描述其外貌特征。
每个提示词控制在120词以内，以获得最佳 SD 1.5 效果。

返回 JSON 对象：{"prompts": ["prompt1", "prompt2", ...]}
顺序必须与输入镜头顺序一致。

只返回合法 JSON，不要使用 markdown，不要解释。"""

SD_PROMPT_SDXL = """\
你是 CutAI，一位专精于 SDXL（1024x1024）图像生成提示词编写的专家。

根据给定的镜头描述列表，将每个镜头的 sd_prompt 改写为流畅的、描述性语言形式的图像描述。请使用连贯的描述性句子——不要使用关键词列表。

用自然语言描述：
- 场景中正在发生什么，谁在画面中
- 环境、场景设定和时间
- 光影质感和色彩情绪
- 摄影视角和构图
- 艺术风格（如「一幅新黑色电影惊悚片的电影剧照」）

不要包含角色名称——改为描述其外貌特征。
每个提示词控制在1-3句话。

返回 JSON 对象：{"prompts": ["prompt1", "prompt2", ...]}
顺序必须与输入镜头顺序一致。

只返回合法 JSON，不要使用 markdown，不要解释。"""


def _get_sd_prompt_system() -> str:
    """Return the appropriate SD prompt system prompt based on IMAGE_PROVIDER."""
    if IMAGE_PROVIDER == "replicate":
        return SD_PROMPT_SDXL
    return SD_PROMPT_SD15


# ---------------------------------------------------------------------------
# Public API — each function = one focused LLM call
# ---------------------------------------------------------------------------

def analyze_shots(
    scene_description: str,
    location: str,
    time_of_day: str,
    characters: list[str],
) -> list[Shot]:
    """Generate a professional shot-by-shot breakdown for a scene.

    Returns a list of validated Shot objects with camera angles, movements,
    descriptions, and placeholder SD prompts.
    """
    messages = [
        {"role": "system", "content": SHOT_ANALYSIS_PROMPT},
        {
            "role": "user",
            "content": (
                f"将以下场景拆分为详细的镜头（建议3-5个镜头）。\n\n"
                f"地点：{location}\n"
                f"时间：{time_of_day}\n"
                f"角色：{', '.join(characters) if characters else '无'}\n\n"
                f"场景描述：\n{scene_description}\n\n"
                f"返回 JSON 对象：{{\"shots\": [...]}}\n"
                f"每个镜头必须包含：shot_number（从1开始）、shot_type、"
                f"camera_angle、camera_movement、description、dialogue（字符串或null）、"
                f"duration_seconds（整数）、sd_prompt（为 SD 1.5 编写的详细视觉提示词）。"
            ),
        },
    ]
    result = chat_with_retry(messages, retries=3)
    raw_shots = result.get("shots", result if isinstance(result, list) else [result])
    if isinstance(raw_shots, dict):
        raw_shots = [raw_shots]
    return [Shot(**s) for s in raw_shots]


def score_mood(
    scene_description: str,
    location: str,
    time_of_day: str,
) -> MoodScore:
    """Score a scene's mood across tension, emotion, energy, and darkness."""
    messages = [
        {"role": "system", "content": MOOD_SCORING_PROMPT},
        {
            "role": "user",
            "content": (
                f"为以下场景进行情绪评分。\n\n"
                f"地点：{location}\n"
                f"时间：{time_of_day}\n\n"
                f"场景描述：\n{scene_description}"
            ),
        },
    ]
    result = chat_with_retry(messages, retries=3)
    return MoodScore(**result)


def suggest_soundtrack(
    scene_description: str,
    mood: MoodScore,
) -> SoundtrackVibe:
    """Suggest a soundtrack vibe for a scene given its description and mood."""
    messages = [
        {"role": "system", "content": SOUNDTRACK_PROMPT},
        {
            "role": "user",
            "content": (
                f"为以下场景推荐配乐风格。\n\n"
                f"场景描述：\n{scene_description}\n\n"
                f"情绪特征：\n"
                f"- 张力：{mood.tension}\n"
                f"- 情感：{mood.emotion}（0=悲伤，1=欢快）\n"
                f"- 能量：{mood.energy}\n"
                f"- 明暗：{mood.darkness}\n"
                f"- 整体情绪：{mood.overall_mood}"
            ),
        },
    ]
    result = chat_with_retry(messages, retries=3)
    return SoundtrackVibe(**result)


def generate_sd_prompts(shots: list[Shot]) -> list[Shot]:
    """Optimize SD prompts for a list of shots.

    Takes existing shots (which may have basic sd_prompt fields) and rewrites
    their prompts to be highly detailed, SD 1.5-optimized visual descriptions.

    Returns new Shot objects with updated sd_prompt fields.
    """
    shot_descriptions = [
        {
            "shot_number": s.shot_number,
            "shot_type": s.shot_type,
            "camera_angle": s.camera_angle,
            "description": s.description,
            "current_sd_prompt": s.sd_prompt,
        }
        for s in shots
    ]

    messages = [
        {"role": "system", "content": _get_sd_prompt_system()},
        {
            "role": "user",
            "content": (
                f"为以下 {len(shots)} 个镜头改写并优化 SD 提示词。\n\n"
                f"镜头列表：\n{_format_shots_for_prompt(shot_descriptions)}\n\n"
                f"返回格式：{{\"prompts\": [\"prompt1\", \"prompt2\", ...]}}\n"
                f"必须按相同顺序返回恰好 {len(shots)} 个提示词。"
            ),
        },
    ]
    result = chat_with_retry(messages, retries=3)
    prompts = result.get("prompts", [])

    # Rebuild shots with optimized prompts, falling back to originals
    updated_shots = []
    for i, shot in enumerate(shots):
        new_prompt = prompts[i] if i < len(prompts) else shot.sd_prompt
        updated_shots.append(shot.model_copy(update={"sd_prompt": new_prompt}))
    return updated_shots


def analyze_scene_full(
    scene_description: str,
    location: str,
    time_of_day: str,
    characters: list[str],
) -> dict:
    """Run the full analysis pipeline for a single scene.

    Calls analyze_shots, score_mood, suggest_soundtrack, and generate_sd_prompts
    sequentially (all use the same LLM, one call at a time).

    Returns a dict with keys: shots, mood, soundtrack.
    """
    shots = analyze_shots(scene_description, location, time_of_day, characters)
    mood = score_mood(scene_description, location, time_of_day)
    soundtrack = suggest_soundtrack(scene_description, mood)
    shots = generate_sd_prompts(shots)
    return {"shots": shots, "mood": mood, "soundtrack": soundtrack}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _format_shots_for_prompt(shot_descriptions: list[dict]) -> str:
    """Format shot descriptions as numbered text for the LLM prompt."""
    lines = []
    for s in shot_descriptions:
        lines.append(
            f"镜头 {s['shot_number']}（{s['shot_type']}，{s['camera_angle']}）："
            f"{s['description']}\n  当前 SD 提示词：{s['current_sd_prompt']}"
        )
    return "\n".join(lines)
