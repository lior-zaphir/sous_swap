# parse_recipe.py
from __future__ import annotations
from llm_client import call_structured
from schemas import ParsedRecipe

SYSTEM = """You extract structured cooking information from recipe text.
Return ONLY data that can be supported by the input. Do not invent ingredients or steps.
If quantity/unit is not stated, set them to null (not an empty string)."""

def parse_recipe(recipe_text: str) -> ParsedRecipe:
    user = f"""Parse this recipe into JSON with:
- title (if present)
- servings (if present)
- ingredients list (name, quantity, unit, notes)
- instructions list (ordered)

Recipe text:
---
{recipe_text}
---
"""
    return call_structured(system=SYSTEM, user=user, schema=ParsedRecipe)
