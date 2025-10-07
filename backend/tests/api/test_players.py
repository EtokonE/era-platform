from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.models import Division, DivisionGroup, Player
from tests.utils.utils import random_lower_string


def create_division(session: Session, *, name: str | None = None) -> Division:
    division = Division(name=name or f"Division-{random_lower_string()[:8]}")
    session.add(division)
    session.commit()
    session.refresh(division)
    return division


def create_group(
    session: Session, *, division: Division, name: str | None = None
) -> DivisionGroup:
    group = DivisionGroup(
        name=name or f"Group-{random_lower_string()[:8]}",
        division_id=division.id,
    )
    session.add(group)
    session.commit()
    session.refresh(group)
    return group


def create_player(
    session: Session,
    *,
    division: Division,
    group: DivisionGroup | None,
    full_name: str | None = None,
) -> Player:
    player = Player(
        full_name=full_name or f"Player-{random_lower_string()[:8]}",
        rating=1500,
        photo_url="https://example.com/photo.jpg",
        division_id=division.id,
        group_id=group.id if group else None,
    )
    session.add(player)
    session.commit()
    session.refresh(player)
    return player


def test_superuser_can_create_and_update_player(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    division = create_division(db)
    group = create_group(db, division=division)

    payload = {
        "full_name": "John Doe",
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
    data = response.json()
    assert data["full_name"] == payload["full_name"]
    assert data["division_id"] == payload["division_id"]

    player_id = data["id"]
    update_payload = {"rating": 1600, "full_name": "John Updated"}
    update_response = client.put(
        f"{settings.API_V1_STR}/players/{player_id}",
        headers=superuser_token_headers,
        json=update_payload,
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["rating"] == update_payload["rating"]
    assert updated["full_name"] == update_payload["full_name"]


def test_normal_user_cannot_create_player(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    db: Session,
) -> None:
    division = create_division(db)
    group = create_group(db, division=division)
    payload = {
        "full_name": "Regular User",
        "rating": 1200,
        "photo_url": "https://example.com/regular.jpg",
        "division_id": str(division.id),
        "group_id": str(group.id),
    }
    response = client.post(
        f"{settings.API_V1_STR}/players/",
        headers=normal_user_token_headers,
        json=payload,
    )
    assert response.status_code == 403


def test_filter_players_by_division_and_group(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    division_one = create_division(db)
    division_two = create_division(db)
    group_one_a = create_group(db, division=division_one)
    group_one_b = create_group(db, division=division_one)
    group_two_a = create_group(db, division=division_two)

    players_payloads = [
        {
            "full_name": "DivisionOneA",
            "rating": 1400,
            "photo_url": "https://example.com/a.jpg",
            "division_id": str(division_one.id),
            "group_id": str(group_one_a.id),
        },
        {
            "full_name": "DivisionOneB",
            "rating": 1450,
            "photo_url": "https://example.com/b.jpg",
            "division_id": str(division_one.id),
            "group_id": str(group_one_b.id),
        },
        {
            "full_name": "DivisionTwo",
            "rating": 1500,
            "photo_url": "https://example.com/c.jpg",
            "division_id": str(division_two.id),
            "group_id": str(group_two_a.id),
        },
    ]

    for payload in players_payloads:
        response = client.post(
            f"{settings.API_V1_STR}/players/",
            headers=superuser_token_headers,
            json=payload,
        )
        assert response.status_code == 201

    division_response = client.get(
        f"{settings.API_V1_STR}/players/",
        headers=superuser_token_headers,
        params={"division_id": str(division_one.id)},
    )
    assert division_response.status_code == 200
    division_data = division_response.json()
    assert division_data["count"] == 2
    names = {item["full_name"] for item in division_data["data"]}
    assert names == {"DivisionOneA", "DivisionOneB"}

    group_response = client.get(
        f"{settings.API_V1_STR}/players/",
        headers=superuser_token_headers,
        params={"group_id": str(group_two_a.id)},
    )
    assert group_response.status_code == 200
    group_data = group_response.json()
    assert group_data["count"] == 1
    assert group_data["data"][0]["full_name"] == "DivisionTwo"

    combined_response = client.get(
        f"{settings.API_V1_STR}/players/",
        headers=superuser_token_headers,
        params={
            "division_id": str(division_one.id),
            "group_id": str(group_one_b.id),
        },
    )
    assert combined_response.status_code == 200
    combined_data = combined_response.json()
    assert combined_data["count"] == 1
    assert combined_data["data"][0]["full_name"] == "DivisionOneB"


def test_deleting_group_keeps_players_and_clears_group(
    db: Session,
) -> None:
    division = create_division(db)
    group = create_group(db, division=division)
    player = create_player(db, division=division, group=group)

    db.delete(group)
    db.commit()

    remaining_player = db.get(Player, player.id)
    assert remaining_player is not None
    assert remaining_player.division_id == division.id
    assert remaining_player.group_id is None
