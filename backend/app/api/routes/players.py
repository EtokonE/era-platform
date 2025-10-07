import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, status

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import Message, PlayerCreate, PlayerPublic, PlayerUpdate, PlayersPublic

router = APIRouter(prefix="/players", tags=["players"])


@router.get("/", response_model=PlayersPublic)
def read_players(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    division_id: uuid.UUID | None = None,
    group_id: uuid.UUID | None = None,
) -> Any:
    players, total = crud.list_players(
        session=session,
        skip=skip,
        limit=limit,
        division_id=division_id,
        group_id=group_id,
    )
    return PlayersPublic(data=players, count=total)


@router.get("/{player_id}", response_model=PlayerPublic)
def read_player(
    *, session: SessionDep, current_user: CurrentUser, player_id: uuid.UUID
) -> Any:
    player = crud.get_player(session=session, player_id=player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


@router.post("/", response_model=PlayerPublic, status_code=status.HTTP_201_CREATED)
def create_player(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    player_in: PlayerCreate,
) -> Any:
    try:
        player = crud.create_player(
            session=session, current_user=current_user, player_in=player_in
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    return player


@router.put("/{player_id}", response_model=PlayerPublic)
def update_player(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    player_id: uuid.UUID,
    player_in: PlayerUpdate,
) -> Any:
    player = crud.get_player(session=session, player_id=player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    try:
        updated = crud.update_player(
            session=session,
            current_user=current_user,
            db_player=player,
            player_in=player_in,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    return updated


@router.delete("/{player_id}")
def delete_player(
    *, session: SessionDep, current_user: CurrentUser, player_id: uuid.UUID
) -> Message:
    player = crud.get_player(session=session, player_id=player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    try:
        crud.delete_player(session=session, current_user=current_user, db_player=player)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    return Message(message="Player deleted successfully")
