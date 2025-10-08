from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.models import Division, DivisionGroup, DivisionGroupPublic, DivisionPublic

router = APIRouter(prefix="/divisions", tags=["divisions"])


@router.get("/", response_model=list[DivisionPublic])
def list_divisions(*, session: SessionDep, _current_user: CurrentUser) -> list[DivisionPublic]:
    divisions = session.exec(select(Division)).all()
    return divisions


@router.get("/{division_id}/groups", response_model=list[DivisionGroupPublic])
def list_division_groups(
    *,
    session: SessionDep,
    _current_user: CurrentUser,
    division_id: uuid.UUID,
) -> list[DivisionGroupPublic]:
    division = session.get(Division, division_id)
    if division is None:
        raise HTTPException(status_code=404, detail="Division not found")
    statement = select(DivisionGroup).where(DivisionGroup.division_id == division_id)
    groups = session.exec(statement).all()
    return groups

