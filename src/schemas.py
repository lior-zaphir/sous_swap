# schemas.py
from __future__ import annotations
from typing import List, Optional, Literal
from pydantic import BaseModel, Field


# --------- 1) Parse recipe from free text ---------

class ParsedIngredient(BaseModel):
    name: str = Field(..., description="Canonical ingredient name, singular when possible (e.g., 'onion').")
    quantity: Optional[str] = Field(None, description="As written or normalized, e.g., '2', '1/2', 'a pinch'.")
    unit: Optional[str] = Field(None, description="e.g., 'g', 'tbsp', 'cups'. If unknown, null.")
    notes: Optional[str] = Field(None, description="Prep/qualifiers like 'minced', 'room temperature', 'optional'.")


class ParsedRecipe(BaseModel):
    title: Optional[str] = None
    servings: Optional[str] = None
    ingredients: List[ParsedIngredient]
    instructions: List[str] = Field(..., description="Ordered steps. Each step is a single sentence or short paragraph.")


# --------- 2) Annotate ingredients (role/stage/importance) ---------

Role = Literal[
    "base_starch", "protein", "vegetable", "sauce_liquid", "fat",
    "aromatic", "spice_herb", "sweetener", "acid", "binder_thickener",
    "dairy", "garnish", "other"
]

Stage = Literal["primary", "secondary", "seasoning_optional"]

Confidence = Literal["high", "medium", "low"]


class IngredientAnnotation(BaseModel):
    ingredient_name: str
    role: Role
    stage: Stage
    importance: Literal["must", "should", "optional"]  # UI can map to your wizard ordering
    confidence: Confidence
    rationale: str = Field(..., description="1-2 short sentences explaining the role/stage assignment.")


class AnnotatedRecipe(BaseModel):
    title: Optional[str] = None
    ingredients: List[IngredientAnnotation]


# --------- 3) Substitution suggestions per ingredient ---------

class SubstitutionOption(BaseModel):
    substitute: str = Field(..., description="Substitute ingredient name (canonical).")
    reason: str = Field(..., description="Why it works in THIS recipe (functional role). 1-2 sentences.")
    adjustment: Optional[str] = Field(
        None,
        description="Any cooking/quantity adjustment the user should know (e.g., 'use 3/4 the amount')."
    )
    confidence: Confidence
    diet_fit: int = Field(
        ...,
        ge=1,
        le=5,
        description="How well this option fits the dietary profile (1=poor, 5=excellent).",
    )
    dish_fit: int = Field(
        ...,
        ge=1,
        le=5,
        description="How well this option preserves the dish style/cohesion (1=poor, 5=excellent).",
    )
    diet_fit_rank: Optional[int] = Field(
        None,
        ge=1,
        le=5,
        description="Tie-break rank for diet fit (1=best). Must be unique within the option list when provided.",
    )
    dish_fit_rank: Optional[int] = Field(
        None,
        ge=1,
        le=5,
        description="Tie-break rank for dish fit (1=best). Must be unique within the option list when provided.",
    )


class SubstitutionSet(BaseModel):
    ingredient_name: str
    options: List[SubstitutionOption] = Field(..., min_length=1, max_length=5)


# Batch response for multiple ingredients (e.g., per stage).
class SubstitutionBatch(BaseModel):
    items: List[SubstitutionSet]


# --------- 4) Rewrite recipe after chosen swaps ---------

class SwapChoice(BaseModel):
    original: str
    chosen: str
    action: Literal["swap", "add"] = "swap"


class RewrittenRecipe(BaseModel):
    title: Optional[str] = None
    ingredients: List[ParsedIngredient]
    instructions: List[str]
    change_log: List[str] = Field(..., description="Bullet-like summary of key changes made.")


# --------- 5) Find existing recipes on the web ---------

class RecipeSearchQuery(BaseModel):
    query: str = Field(..., description="Search engine query for recipe pages.")


class RecipeSiteCandidate(BaseModel):
    url: str = Field(..., description="Full URL of a recipe page.")
    title: Optional[str] = Field(None, description="Recipe title if known.")
    site_name: Optional[str] = Field(None, description="Site or publisher name.")
    reason: Optional[str] = Field(None, description="Why this recipe matches the swaps.")


class RecipeSiteList(BaseModel):
    items: List[RecipeSiteCandidate] = Field(..., min_length=1, max_length=5)


class RecipePreview(BaseModel):
    url: str
    title: Optional[str] = None
    site_name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    used_ingredients: Optional[List[str]] = None
