"""Service layer for saved party profile operations."""
from __future__ import annotations

from sqlalchemy.orm import Session

from models.party import Party as PartyModel


def list_parties(db: Session, user_id: int) -> list[PartyModel]:
    return (
        db.query(PartyModel)
        .filter(PartyModel.user_id == user_id)
        .order_by(PartyModel.label)
        .all()
    )


def get_party(db: Session, user_id: int, party_id: int) -> PartyModel | None:
    return (
        db.query(PartyModel)
        .filter(PartyModel.id == party_id, PartyModel.user_id == user_id)
        .first()
    )


def create_party(
    db: Session,
    user_id: int,
    label: str,
    company: str = "",
    name: str = "",
    title: str = "",
    address: str = "",
) -> PartyModel:
    party = PartyModel(
        user_id=user_id,
        label=label,
        company=company,
        name=name,
        title=title,
        address=address,
    )
    db.add(party)
    db.commit()
    db.refresh(party)
    return party


def update_party(
    db: Session,
    user_id: int,
    party_id: int,
    **kwargs: str | None,
) -> PartyModel | None:
    party = get_party(db, user_id, party_id)
    if not party:
        return None
    for key, value in kwargs.items():
        if value is not None and hasattr(party, key):
            setattr(party, key, value)
    db.commit()
    db.refresh(party)
    return party


def delete_party(db: Session, user_id: int, party_id: int) -> bool:
    party = get_party(db, user_id, party_id)
    if not party:
        return False
    db.delete(party)
    db.commit()
    return True
