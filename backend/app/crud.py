import uuid
from typing import Any

from sqlmodel import Session, func, select

from app.core.security import get_password_hash, verify_password
from app.models import (
    Division,
    DivisionGroup,
    Item,
    ItemCreate,
    Player,
    PlayerCreate,
    PlayerUpdate,
    User,
    UserCreate,
    UserUpdate,
)


def ensure_superuser(user: User) -> None:
    if not user.is_superuser:
        raise PermissionError("The user doesn't have enough privileges")


def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    return db_user


def create_item(*, session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Item:
    db_item = Item.model_validate(item_in, update={"owner_id": owner_id})
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


def create_player(
    *, session: Session, player_in: PlayerCreate, current_user: User
) -> Player:
    ensure_superuser(current_user)
    db_player = Player.model_validate(player_in)
    session.add(db_player)
    session.commit()
    session.refresh(db_player)
    return db_player


def update_player(
    *,
    session: Session,
    db_player: Player,
    player_in: PlayerUpdate,
    current_user: User,
) -> Player:
    ensure_superuser(current_user)
    player_data = player_in.model_dump(exclude_unset=True)
    db_player.sqlmodel_update(player_data)
    session.add(db_player)
    session.commit()
    session.refresh(db_player)
    return db_player


def delete_player(*, session: Session, db_player: Player, current_user: User) -> None:
    ensure_superuser(current_user)
    session.delete(db_player)
    session.commit()


def get_player(*, session: Session, player_id: uuid.UUID) -> Player | None:
    return session.get(Player, player_id)


def get_players(
    *,
    session: Session,
    division_id: uuid.UUID | None = None,
    group_id: uuid.UUID | None = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[Player], int]:
    statement = select(Player)
    count_statement = select(func.count()).select_from(Player)

    if division_id is not None:
        statement = statement.where(Player.division_id == division_id)
        count_statement = count_statement.where(Player.division_id == division_id)
    if group_id is not None:
        statement = statement.where(Player.group_id == group_id)
        count_statement = count_statement.where(Player.group_id == group_id)

    players = list(session.exec(statement.offset(skip).limit(limit)).all())
    total = session.exec(count_statement).one()
    return players, total


def get_divisions(
    *, session: Session, skip: int = 0, limit: int = 100
) -> tuple[list[Division], int]:
    statement = select(Division).offset(skip).limit(limit)
    divisions = list(session.exec(statement).all())
    total = session.exec(select(func.count()).select_from(Division)).one()
    return divisions, total


def get_division_groups(
    *,
    session: Session,
    division_id: uuid.UUID | None = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[DivisionGroup], int]:
    statement = select(DivisionGroup)
    count_statement = select(func.count()).select_from(DivisionGroup)

    if division_id is not None:
        statement = statement.where(DivisionGroup.division_id == division_id)
        count_statement = count_statement.where(
            DivisionGroup.division_id == division_id
        )

    groups = list(session.exec(statement.offset(skip).limit(limit)).all())
    total = session.exec(count_statement).one()
    return groups, total
