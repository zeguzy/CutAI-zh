"""CRUD routes for projects."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.database import get_session
from models.db_models import Project
from models.schemas import ProjectCreate, ProjectResponse

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(
    body: ProjectCreate,
    session: AsyncSession = Depends(get_session),
):
    project = Project(title=body.title, genre=body.genre)
    session.add(project)
    await session.commit()
    await session.refresh(project)
    return _to_response(project)


@router.get("", response_model=list[ProjectResponse])
async def list_projects(session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(Project).order_by(Project.updated_at.desc())
    )
    return [_to_response(p) for p in result.scalars().all()]


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    session: AsyncSession = Depends(get_session),
):
    project = await session.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    return _to_response(project)


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: int,
    session: AsyncSession = Depends(get_session),
):
    project = await session.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    await session.delete(project)
    await session.commit()


def _to_response(project: Project) -> dict:
    return {
        "id": project.id,
        "title": project.title,
        "genre": project.genre,
        "created_at": project.created_at.isoformat() if project.created_at else "",
        "updated_at": project.updated_at.isoformat() if project.updated_at else "",
    }
