from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator


class MndaTerm(BaseModel):
    type: Literal["expires", "continues"]
    years: int | None = Field(default=None, ge=1)

    @model_validator(mode="after")
    def years_required_when_expires(self) -> MndaTerm:
        if self.type == "expires" and self.years is None:
            raise ValueError("years is required when type is 'expires'")
        return self


class TermOfConfidentiality(BaseModel):
    type: Literal["years", "perpetuity"]
    years: int | None = Field(default=None, ge=1)

    @model_validator(mode="after")
    def years_required_when_fixed(self) -> TermOfConfidentiality:
        if self.type == "years" and self.years is None:
            raise ValueError("years is required when type is 'years'")
        return self


class NdaParty(BaseModel):
    company: str
    name: str
    title: str
    address: str


class NdaRequest(BaseModel):
    purpose: str
    effective_date: str
    mnda_term: MndaTerm
    term_of_confidentiality: TermOfConfidentiality
    governing_law: str
    jurisdiction: str
    modifications: str
    party1: NdaParty
    party2: NdaParty

    @field_validator("effective_date")
    @classmethod
    def validate_date_format(cls, v: str) -> str:
        try:
            date.fromisoformat(v)
        except ValueError:
            raise ValueError("effective_date must be in YYYY-MM-DD format")
        return v
