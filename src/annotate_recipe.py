# annotate_recipe.py
from __future__ import annotations
from src.llm_client import call_structured
from src.schemas import ParsedRecipe, AnnotatedRecipe

SYSTEM = """You label recipe ingredients for an interactive ingredient-editing wizard.

You MUST:
- Use ONLY these roles:
  base_starch, protein, vegetable, sauce_liquid, fat, aromatic, spice_herb,
  sweetener, acid, binder_thickener, dairy, garnish, other
- Use ONLY these stages:
  primary, secondary, seasoning_optional
- Provide a short rationale per ingredient.
- If unsure, set confidence to low.

Guidance:
- primary = ingredients that define the dish structure (base/protein/main veg)
- secondary = supporting components (sauce components, side veg, mix-ins)
- seasoning_optional = spices/herbs, garnish, small flavoring agents
- Map common pantry items to specific roles when possible (avoid "other"):
  - salt, pepper, dried spices, herbs -> spice_herb
  - oils, butter, ghee -> fat
  - pasta/noodles/rice/bread/grains -> base_starch
  - cheese/milk/cream/yogurt -> dairy
  - vinegar/lemon/lime -> acid
"""

def annotate_recipe(parsed: ParsedRecipe) -> AnnotatedRecipe:
    # Keep the prompt compact: ingredient list + optional title
    ing_lines = []
    for ing in parsed.ingredients:
        q = f"{ing.quantity} " if ing.quantity else ""
        u = f"{ing.unit} " if ing.unit else ""
        n = f" ({ing.notes})" if ing.notes else ""
        ing_lines.append(f"- {q}{u}{ing.name}{n}")

    user = f"""Recipe title: {parsed.title or "Unknown"}
Ingredients:
{chr(10).join(ing_lines)}

Label EACH ingredient with role, stage, importance (must/should/optional), confidence, and rationale.
"""
    return call_structured(system=SYSTEM, user=user, schema=AnnotatedRecipe)
