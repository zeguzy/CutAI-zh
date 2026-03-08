"""CRUD routes for scripts."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.database import get_session
from models.db_models import Script, Scene, Shot
from models.schemas import ScriptCreate, ScriptResponse, ScriptUpdate, SceneResponse, ShotResponse

router = APIRouter(prefix="/api/scripts", tags=["scripts"])


@router.post("/{project_id}", response_model=ScriptResponse, status_code=201)
async def create_script(
    project_id: int,
    body: ScriptCreate,
    session: AsyncSession = Depends(get_session),
):
    script = Script(
        project_id=project_id,
        title=body.title,
        genre=body.genre,
        logline=body.logline,
        raw_text=body.raw_text,
    )
    session.add(script)
    await session.commit()
    await session.refresh(script)
    return _to_response(script)


@router.get("/{script_id}", response_model=ScriptResponse)
async def get_script(
    script_id: int,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Script)
        .where(Script.id == script_id)
        .options(
            selectinload(Script.scenes).selectinload(Scene.shots)
        )
    )
    script = result.scalar_one_or_none()
    if not script:
        raise HTTPException(404, "Script not found")
    return _to_response(script, include_scenes=True)


@router.put("/{script_id}", response_model=ScriptResponse)
async def update_script(
    script_id: int,
    body: ScriptUpdate,
    session: AsyncSession = Depends(get_session),
):
    script = await session.get(Script, script_id)
    if not script:
        raise HTTPException(404, "Script not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(script, field, value)
    await session.commit()
    await session.refresh(script)
    return _to_response(script)


@router.get("/project/{project_id}", response_model=list[ScriptResponse])
async def list_scripts_for_project(
    project_id: int,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Script)
        .where(Script.project_id == project_id)
        .order_by(Script.created_at.desc())
    )
    return [_to_response(s) for s in result.scalars().all()]


def _to_response(script: Script, include_scenes: bool = False) -> dict:
    data = {
        "id": script.id,
        "title": script.title,
        "genre": script.genre,
        "logline": script.logline,
        "raw_text": script.raw_text,
        "total_duration_seconds": script.total_duration_seconds,
        "created_at": script.created_at.isoformat() if script.created_at else "",
        "scenes": [],
    }
    if include_scenes:
        data["scenes"] = [_scene_to_response(sc) for sc in script.scenes]
    return data


def _scene_to_response(scene: Scene) -> dict:
    return {
        "id": scene.id,
        "scene_number": scene.scene_number,
        "title": scene.title,
        "location": scene.location,
        "time_of_day": scene.time_of_day,
        "description": scene.description,
        "characters": scene.characters or [],
        "mood": {
            "tension": scene.mood_tension,
            "emotion": scene.mood_emotion,
            "energy": scene.mood_energy,
            "darkness": scene.mood_darkness,
            "overall_mood": scene.mood_overall or "neutral",
        },
        "soundtrack": {
            "genre": scene.soundtrack_genre or "",
            "tempo": scene.soundtrack_tempo or "moderate",
            "instruments": scene.soundtrack_instruments or [],
            "reference_track": scene.soundtrack_reference or "",
            "energy_level": scene.soundtrack_energy,
        },
        "frame_image_path": scene.frame_image_path,
        "shots": [_shot_to_response(sh) for sh in scene.shots],
    }


def _shot_to_response(shot: Shot) -> dict:
    return {
        "id": shot.id,
        "shot_number": shot.shot_number,
        "shot_type": shot.shot_type,
        "camera_angle": shot.camera_angle,
        "camera_movement": shot.camera_movement,
        "description": shot.description,
        "dialogue": shot.dialogue,
        "duration_seconds": shot.duration_seconds,
        "sd_prompt": shot.sd_prompt,
    }
