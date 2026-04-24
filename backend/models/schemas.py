"""Pydantic v2 schemas for CutAI data models."""

from pydantic import BaseModel


class Shot(BaseModel):
    shot_number: int
    shot_type: str          # 镜头类型："wide"全景, "close-up"特写, "medium"中景, "over-the-shoulder"过肩, "POV"主观, "aerial"航拍, "tracking"跟踪
    camera_angle: str       # 摄影角度："eye-level"平视, "low-angle"仰拍, "high-angle"俯拍, "dutch-angle"倾斜, "bird's-eye"鸟瞰
    camera_movement: str    # 摄影机运动："static"静止, "pan-left"左摇, "pan-right"右摇, "tilt-up"仰俯, "tilt-down"俯仰, "dolly-in"推入, "dolly-out"拉出, "crane"摇臂
    description: str
    dialogue: str | None = None
    duration_seconds: int
    sd_prompt: str


class MoodScore(BaseModel):
    tension: float          # 张力：0.0 - 1.0
    emotion: float          # 情感：0.0（悲伤）- 1.0（欢快）
    energy: float           # 能量：0.0（平静）- 1.0（激烈）
    darkness: float         # 明暗：0.0（明亮）- 1.0（阴暗）
    overall_mood: str       # 整体情绪：「忧郁」「惊悚」「浪漫」「诡异」「壮烈」等


class SoundtrackVibe(BaseModel):
    genre: str              # 音乐类型：「氛围电子」「管弦乐」「Lo-Fi」「爵士」「合成器浪潮」等
    tempo: str              # 节奏：「slow」慢、「moderate」中、「fast」快
    instruments: list[str]  # 乐器列表，如 ["钢琴", "弦乐", "合成器pad", "鼓"]
    reference_track: str    # 参考曲目，如「类似：Hans Zimmer - Time」
    energy_level: float     # 能量等级：0.0 - 1.0


class Scene(BaseModel):
    scene_number: int
    title: str
    location: str           # 如「内景. 咖啡馆 - 夜」
    time_of_day: str        # 「dawn」黎明、「morning」上午、「afternoon」下午、「evening」傍晚、「night」夜晚
    description: str
    characters: list[str]
    shots: list[Shot]
    mood: MoodScore | None = None
    soundtrack: SoundtrackVibe | None = None
    frame_image_path: str | None = None


class Script(BaseModel):
    title: str
    genre: str
    logline: str
    scenes: list[Scene]
    total_duration_seconds: int


# --- Request / Response helpers ---

class ProjectCreate(BaseModel):
    title: str
    genre: str | None = None


class ProjectResponse(BaseModel):
    id: int
    title: str
    genre: str | None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class ScriptCreate(BaseModel):
    title: str
    genre: str | None = None
    logline: str | None = None
    raw_text: str | None = None


class GenerateRequest(BaseModel):
    genre: str
    premise: str
    num_scenes: int = 5


class StoryboardGenerateRequest(BaseModel):
    """分镜生成请求。

    提供 script_text（解析已有剧本）或 genre + premise（AI 生成）。
    """
    script_text: str | None = None
    genre: str | None = None
    premise: str | None = None
    num_scenes: int = 5
    title: str = "未命名项目"


class ScriptUpdate(BaseModel):
    title: str | None = None
    genre: str | None = None
    logline: str | None = None
    raw_text: str | None = None


class SceneUpdate(BaseModel):
    title: str | None = None
    location: str | None = None
    time_of_day: str | None = None
    description: str | None = None
    characters: list[str] | None = None


class SceneReorder(BaseModel):
    """按指定顺序排列的场景 ID 列表。"""
    scene_ids: list[int]


class SceneCreate(BaseModel):
    """创建一个新的空白场景。"""
    title: str = "新场景"
    location: str | None = None
    time_of_day: str | None = None
    description: str | None = None


class RegenerateFrameRequest(BaseModel):
    """重新生成镜头画面的请求，可附带自定义提示词。"""
    sd_prompt: str | None = None


class ShotPromptUpdate(BaseModel):
    """更新镜头的 SD 提示词。"""
    sd_prompt: str


# --- Full response models for export ---

class ShotResponse(BaseModel):
    id: int
    shot_number: int
    shot_type: str
    camera_angle: str
    camera_movement: str
    description: str | None
    dialogue: str | None
    duration_seconds: int
    sd_prompt: str | None

    class Config:
        from_attributes = True


class SceneResponse(BaseModel):
    id: int
    scene_number: int
    title: str
    location: str | None
    time_of_day: str | None
    description: str | None
    characters: list
    mood: MoodScore | None = None
    soundtrack: SoundtrackVibe | None = None
    frame_image_path: str | None
    shots: list[ShotResponse] = []

    class Config:
        from_attributes = True


class ScriptResponse(BaseModel):
    id: int
    title: str
    genre: str | None
    logline: str | None
    raw_text: str | None
    total_duration_seconds: int
    created_at: str
    scenes: list[SceneResponse] = []

    class Config:
        from_attributes = True


class ProjectDetailResponse(BaseModel):
    id: int
    title: str
    genre: str | None
    created_at: str
    updated_at: str
    scripts: list[ScriptResponse] = []

    class Config:
        from_attributes = True
