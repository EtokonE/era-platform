from fastapi.testclient import TestClient
from sqlmodel import Session, delete

from app.models import Division, DivisionGroup


def _create_division(session: Session, *, name: str, description: str | None = None) -> Division:
    division = Division(name=name, description=description)
    session.add(division)
    session.commit()
    session.refresh(division)
    return division


def _create_group(session: Session, *, division: Division, name: str) -> DivisionGroup:
    group = DivisionGroup(name=name, division_id=division.id)
    session.add(group)
    session.commit()
    session.refresh(group)
    return group


def test_list_divisions_returns_paginated_payload(
    client: TestClient, db: Session, superuser_token_headers: dict[str, str]
) -> None:
    db.execute(delete(DivisionGroup))
    db.execute(delete(Division))
    db.commit()

    division = _create_division(db, name="Premier", description="Top division")

    response = client.get("/api/v1/divisions/", headers=superuser_token_headers)

    assert response.status_code == 200
    payload = response.json()
    assert payload["count"] == 1
    assert payload["data"][0]["id"] == str(division.id)
    assert payload["data"][0]["name"] == "Premier"
    assert payload["data"][0]["description"] == "Top division"


def test_list_division_groups_can_filter_by_division(
    client: TestClient, db: Session, superuser_token_headers: dict[str, str]
) -> None:
    db.execute(delete(DivisionGroup))
    db.execute(delete(Division))
    db.commit()

    target_division = _create_division(db, name="Division A")
    other_division = _create_division(db, name="Division B")

    group = _create_group(db, division=target_division, name="Group A1")
    _create_group(db, division=other_division, name="Group B1")

    response = client.get(
        f"/api/v1/division-groups/?division_id={target_division.id}",
        headers=superuser_token_headers,
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["count"] == 1
    assert payload["data"][0]["id"] == str(group.id)
    assert payload["data"][0]["division_id"] == str(target_division.id)
