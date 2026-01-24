from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional
from uuid import uuid4

from app.models.core import AnnotatedRecipe, ParsedRecipe, Stage, SwapChoice, SubstitutionBatch


STAGE_ORDER: List[Stage] = ["primary", "secondary", "seasoning_optional"]


@dataclass
class SessionState:
    parsed_recipe: ParsedRecipe
    annotated_recipe: AnnotatedRecipe
    current_recipe: ParsedRecipe
    allowed_ingredients: List[str]
    diet_name: Optional[str]
    diet_instructions: Optional[str]
    allow_out_of_list: bool
    stage_index: int = 0
    swap_history: List[SwapChoice] = field(default_factory=list)
    precomputed_substitutions: Optional[Dict[Stage, "SubstitutionBatch"]] = None

    @property
    def stage_order(self) -> List[Stage]:
        return list(STAGE_ORDER)

    def current_stage(self) -> Optional[Stage]:
        if self.stage_index >= len(STAGE_ORDER):
            return None
        return STAGE_ORDER[self.stage_index]

    def advance_stage(self) -> None:
        self.stage_index = min(self.stage_index + 1, len(STAGE_ORDER))


class InMemorySessionStore:
    def __init__(self) -> None:
        self._sessions: Dict[str, SessionState] = {}

    def create(self, state: SessionState) -> str:
        session_id = uuid4().hex
        self._sessions[session_id] = state
        return session_id

    def get(self, session_id: str) -> Optional[SessionState]:
        return self._sessions.get(session_id)

    def update(self, session_id: str, state: SessionState) -> None:
        self._sessions[session_id] = state
