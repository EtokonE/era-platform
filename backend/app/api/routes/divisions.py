import uuid
from typing import Any

from fastapi import APIRouter

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import DivisionGroupsPublic, DivisionsPublic

router = APIRouter(prefix="/divisions", tags=["divisions"])
groups_router = APIRouter(prefix="/division-groups", tags=["divisions"])


@router.get("/", response_model=DivisionsPublic)
def list_divisions(
    *, session: SessionDep, _current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    divisions, count = crud.get_divisions(session=session, skip=skip, limit=limit)
    return DivisionsPublic(data=divisions, count=count)


@groups_router.get("/", response_model=DivisionGroupsPublic)
def list_division_groups(
    *,
    session: SessionDep,
    _current_user: CurrentUser,
    division_id: uuid.UUID | None = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    groups, count = crud.get_division_groups(
        session=session,
        division_id=division_id,
        skip=skip,
        limit=limit,
    )
    return DivisionGroupsPublic(data=groups, count=count)


__all__ = ["router", "groups_router"]
