"""CRUD routes for scenes — get, update, reorder, edit details."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.database import get_session
from models.db_models import Scene, Shot
from models.schemas import SceneUpdate, SceneReorder

router = APIRouter(prefix="/api/scenes", tags=["scenes"])


@router.get("/script/{script_id}")
async def list_scenes_for_script(
    script_id: int,
    session: AsyncSession = Depends(get_session),
):
    """Get all scenes for a script, ordered by scene_number, with shots."""
    result = await session.execute(
        select(Scene)
        .where(Scene.script_id == script_id)
        .options(selectinload(Scene.shots))
        .order_by(Scene.scene_number)
    )
    scenes = result.scalars().all()
    return [_scene_to_response(sc) for sc in scenes]


@router.get("/{scene_id}")
async def get_scene(
    scene_id: int,
    session: AsyncSession = Depends(get_session),
):
    """Get a single scene with its shots."""
    result = await session.execute(
        select(Scene)
        .where(Scene.id == scene_id)
        .options(selectinload(Scene.shots))
    )
    scene = result.scalar_one_or_none()
    if not scene:
        raise HTTPException(404, "Scene not found")
    return _scene_to_response(scene)


@router.put("/{scene_id}")
async def update_scene(
    scene_id: int,
    body: SceneUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Edit scene details (title, location, time_of_day, description, characters)."""
    scene = await session.get(Scene, scene_id)
    if not scene:
        raise HTTPException(404, "Scene not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(scene, field, value)
    await session.commit()
    await session.refresh(scene)
    # Re-fetch with shots loaded
    result = await session.execute(
        select(Scene)
        .where(Scene.id == scene_id)
        .options(selectinload(Scene.shots))
    )
    scene = result.scalar_one()
    return _scene_to_response(scene)


@router.put("/reorder/{script_id}")
async def reorder_scenes(
    script_id: int,
    body: SceneReorder,
    session: AsyncSession = Depends(get_session),
):
    """Update scene order. Accepts a list of scene IDs in the desired order."""
    result = await session.execute(
        select(Scene).where(Scene.script_id == script_id)
    )
    scenes = {s.id: s for s in result.scalars().all()}

    for new_number, scene_id in enumerate(body.scene_ids, start=1):
        if scene_id not in scenes:
            raise HTTPException(400, f"Scene {scene_id} not found in script {script_id}")
        scenes[scene_id].scene_number = new_number

    await session.commit()
    return {"message": "Scenes reordered", "order": body.scene_ids}


@router.delete("/{scene_id}", status_code=204)
async def delete_scene(
    scene_id: int,
    session: AsyncSession = Depends(get_session),
):
    """Delete a scene and its shots."""
    scene = await session.get(Scene, scene_id)
    if not scene:
        raise HTTPException(404, "Scene not found")
    await session.delete(scene)
    await session.commit()


# ---------------------------------------------------------------------------
# Response helpers
# ---------------------------------------------------------------------------

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
        "shots": [
            {
                "id": sh.id,
                "shot_number": sh.shot_number,
                "shot_type": sh.shot_type,
                "camera_angle": sh.camera_angle,
                "camera_movement": sh.camera_movement,
                "description": sh.description,
                "dialogue": sh.dialogue,
                "duration_seconds": sh.duration_seconds,
                "sd_prompt": sh.sd_prompt,
            }
            for sh in scene.shots
        ],
    }
