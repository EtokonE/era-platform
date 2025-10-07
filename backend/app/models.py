import uuid

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


class DivisionBase(SQLModel):
    name: str = Field(max_length=255, unique=True, index=True)
    description: str | None = Field(default=None, max_length=512)


class Division(DivisionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    groups: list["DivisionGroup"] = Relationship(
        back_populates="division",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    players: list["Player"] = Relationship(
        back_populates="division",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class DivisionGroupBase(SQLModel):
    name: str = Field(max_length=255, index=True)


class DivisionGroup(DivisionGroupBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    division_id: uuid.UUID = Field(
        foreign_key="division.id", nullable=False, ondelete="CASCADE"
    )
    division: Division | None = Relationship(back_populates="groups")
    players: list["Player"] = Relationship(
        back_populates="group",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class PlayerBase(SQLModel):
    full_name: str = Field(max_length=255)
    rating: int = Field(default=0, ge=0)
    photo_url: str | None = Field(default=None, max_length=1024)
    division_id: uuid.UUID
    group_id: uuid.UUID | None = None


class Player(PlayerBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    division_id: uuid.UUID = Field(
        foreign_key="division.id", nullable=False, ondelete="CASCADE"
    )
    group_id: uuid.UUID | None = Field(
        default=None,
        foreign_key="divisiongroup.id",
        nullable=True,
        ondelete="SET NULL",
    )
    division: Division | None = Relationship(back_populates="players")
    group: DivisionGroup | None = Relationship(back_populates="players")


class PlayerCreate(PlayerBase):
    pass


class PlayerUpdate(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    rating: int | None = Field(default=None, ge=0)
    photo_url: str | None = Field(default=None, max_length=1024)
    division_id: uuid.UUID | None = None
    group_id: uuid.UUID | None = None


class PlayerPublic(PlayerBase):
    id: uuid.UUID


class PlayersPublic(SQLModel):
    data: list[PlayerPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)
