import logging

from fastapi import APIRouter, Depends, HTTPException, status

from database import get_db
from deps import get_current_user
from models.user import User
from schemas.document import PartyProfileCreate, PartyProfileSummary, PartyProfileUpdate
from services import party_service
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/parties", response_model=list[PartyProfileSummary])
def list_parties(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[PartyProfileSummary]:
    return party_service.list_parties(db, current_user.id)


@router.post("/parties", response_model=PartyProfileSummary, status_code=status.HTTP_201_CREATED)
def create_party(
    body: PartyProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PartyProfileSummary:
    return party_service.create_party(
        db,
        current_user.id,
        label=body.label,
        company=body.company,
        name=body.name,
        title=body.title,
        address=body.address,
    )


@router.put("/parties/{party_id}", response_model=PartyProfileSummary)
def update_party(
    party_id: int,
    body: PartyProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PartyProfileSummary:
    party = party_service.update_party(
        db,
        current_user.id,
        party_id,
        **{k: v for k, v in body.model_dump().items() if v is not None},
    )
    if not party:
        raise HTTPException(status_code=404, detail="Party profile not found")
    return party


@router.delete("/parties/{party_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_party(
    party_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    if not party_service.delete_party(db, current_user.id, party_id):
        raise HTTPException(status_code=404, detail="Party profile not found")
