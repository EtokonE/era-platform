import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, status

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import Message, PlayerCreate, PlayerPublic, PlayerUpdate, PlayersPublic

router = APIRouter(prefix="/players", tags=["players"])


@router.get("/", response_model=PlayersPublic)
def list_players(
    *,
    session: SessionDep,
    _current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    division_id: uuid.UUID | None = None,
    group_id: uuid.UUID | None = None,
) -> Any:
    players, count = crud.get_players(
        session=session,
        division_id=division_id,
        group_id=group_id,
        skip=skip,
        limit=limit,
    )
    return PlayersPublic(data=players, count=count)


@router.get("/{player_id}", response_model=PlayerPublic)
def get_player(
    *,
    session: SessionDep,
    player_id: uuid.UUID,
    _current_user: CurrentUser,
) -> Any:
    player = crud.get_player(session=session, player_id=player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


@router.post(
    "/",
    response_model=PlayerPublic,
    status_code=status.HTTP_201_CREATED,
)
def create_player(
    *,
    session: SessionDep,
    player_in: PlayerCreate,
    current_user: CurrentUser,
) -> Any:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    try:
        player = crud.create_player(
            session=session, player_in=player_in, current_user=current_user
        )
    except PermissionError as exc:  # pragma: no cover - double check
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    return player


@router.put("/{player_id}", response_model=PlayerPublic)
def update_player(
    *,
    session: SessionDep,
    player_id: uuid.UUID,
    player_in: PlayerUpdate,
    current_user: CurrentUser,
) -> Any:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    player = crud.get_player(session=session, player_id=player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    try:
        updated_player = crud.update_player(
            session=session,
            db_player=player,
            player_in=player_in,
            current_user=current_user,
        )
    except PermissionError as exc:  # pragma: no cover - double check
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    return updated_player


@router.delete("/{player_id}", response_model=Message)
def delete_player(
    *,
    session: SessionDep,
    player_id: uuid.UUID,
    current_user: CurrentUser,
) -> Any:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    player = crud.get_player(session=session, player_id=player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    try:
        crud.delete_player(session=session, db_player=player, current_user=current_user)
    except PermissionError as exc:  # pragma: no cover - double check
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    return Message(message="Player deleted successfully")
