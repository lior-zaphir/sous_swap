from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel

from app.models.core import (
    AnnotatedRecipe,
    IngredientAnnotation,
    ParsedRecipe,
    RewrittenRecipe,
    Stage,
    SwapChoice,
    SubstitutionBatch,
)


class DietProfile(BaseModel):
    name: str
    instructions: str


class CreateSessionRequest(BaseModel):
    recipe_text: str
    allowed_ingredients: List[str]
    diet_profile: Optional[DietProfile] = None
    allow_out_of_list: bool = False
    preload_substitutions: bool = False


class CreateSessionResponse(BaseModel):
    session_id: str
    parsed_recipe: ParsedRecipe
    annotated_recipe: AnnotatedRecipe
    stage_order: List[Stage]
    precomputed_substitutions: Optional[dict[Stage, SubstitutionBatch]] = None


class StageResponse(BaseModel):
    stage: Stage
    ingredients: List[IngredientAnnotation]


class SubstitutionsRequest(BaseModel):
    stage: Stage


class SubstitutionsResponse(BaseModel):
    batch: SubstitutionBatch


class ApplySwapsRequest(BaseModel):
    swaps: List[SwapChoice]


class ApplySwapsResponse(BaseModel):
    rewritten_recipe: RewrittenRecipe
    current_recipe: ParsedRecipe
    swap_history: List[SwapChoice]


class FinalizeRequest(BaseModel):
    swaps: Optional[List[SwapChoice]] = None
