import uuid

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.models import Division, DivisionGroup, Player


@pytest.fixture()
def division(db: Session) -> Division:
    division = Division(name=f"Division-{uuid.uuid4()}")
    db.add(division)
    db.commit()
    db.refresh(division)
    return division


@pytest.fixture()
def group(db: Session, division: Division) -> DivisionGroup:
    division_group = DivisionGroup(name=f"Group-{uuid.uuid4()}", division_id=division.id)
    db.add(division_group)
    db.commit()
    db.refresh(division_group)
    return division_group


def test_superuser_can_create_and_update_player(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
    division: Division,
    group: DivisionGroup,
) -> None:
    payload = {
        "full_name": "Test Player",
        "rating": 1500,
        "photo_url": "https://example.com/photo.jpg",
        "division_id": str(division.id),
        "group_id": str(group.id),
    }
    response = client.post(
        f"{settings.API_V1_STR}/players/",
        headers=superuser_token_headers,
        json=payload,
    )
    assert response.status_code == 201
    created = response.json()
    assert created["full_name"] == payload["full_name"]
    assert created["rating"] == payload["rating"]
    assert created["division_id"] == payload["division_id"]
    assert created["group_id"] == payload["group_id"]

    update_payload = {"rating": 1600}
    response = client.put(
        f"{settings.API_V1_STR}/players/{created['id']}",
        headers=superuser_token_headers,
        json=update_payload,
    )
    assert response.status_code == 200
    updated = response.json()
    assert updated["rating"] == update_payload["rating"]
    assert updated["full_name"] == payload["full_name"]


def test_normal_user_cannot_modify_players(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    division: Division,
    group: DivisionGroup,
) -> None:
    payload = {
        "full_name": "Unauthorized Player",
        "rating": 1000,
        "division_id": str(division.id),
        "group_id": str(group.id),
    }
    response = client.post(
        f"{settings.API_V1_STR}/players/",
        headers=normal_user_token_headers,
        json=payload,
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "User lacks superuser privileges"


def _create_player(
    db: Session,
    *,
    full_name: str,
    rating: int,
    division: Division,
    group: DivisionGroup | None,
) -> Player:
    player = Player(
        full_name=full_name,
        rating=rating,
        division_id=division.id,
        group_id=group.id if group else None,
    )
    db.add(player)
    db.commit()
    db.refresh(player)
    return player


def test_filter_players_by_division_and_group(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    normal_user_token_headers: dict[str, str],
    db: Session,
) -> None:
    division_one = Division(name=f"Division-{uuid.uuid4()}")
    division_two = Division(name=f"Division-{uuid.uuid4()}")
    db.add(division_one)
    db.add(division_two)
    db.commit()
    db.refresh(division_one)
    db.refresh(division_two)

    group_one = DivisionGroup(name=f"Group-{uuid.uuid4()}", division_id=division_one.id)
    group_two = DivisionGroup(name=f"Group-{uuid.uuid4()}", division_id=division_one.id)
    db.add(group_one)
    db.add(group_two)
    db.commit()
    db.refresh(group_one)
    db.refresh(group_two)

    _create_player(
        db,
        full_name="Division One - Group One",
        rating=1200,
        division=division_one,
        group=group_one,
    )
    _create_player(
        db,
        full_name="Division One - Group Two",
        rating=1250,
        division=division_one,
        group=group_two,
    )
    _create_player(
        db,
        full_name="Division Two",
        rating=1300,
        division=division_two,
        group=None,
    )

    response = client.get(
        f"{settings.API_V1_STR}/players/",
        headers=normal_user_token_headers,
        params={"division_id": str(division_one.id)},
    )
    assert response.status_code == 200
    content = response.json()
    assert content["count"] == 2
    assert {player["full_name"] for player in content["data"]} == {
        "Division One - Group One",
        "Division One - Group Two",
    }

    response = client.get(
        f"{settings.API_V1_STR}/players/",
        headers=superuser_token_headers,
        params={"group_id": str(group_one.id)},
    )
    assert response.status_code == 200
    content = response.json()
    assert content["count"] == 1
    assert content["data"][0]["full_name"] == "Division One - Group One"
