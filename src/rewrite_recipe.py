# rewrite_recipe.py
from __future__ import annotations
from llm_client import call_structured
from schemas import ParsedRecipe, SwapChoice, RewrittenRecipe

SYSTEM = """You rewrite a recipe after ingredient substitutions.

Rules:
- Preserve the original cooking intent and structure as much as possible.
- Only change ingredients that are explicitly swapped by the user.
- Update ingredient list and instructions accordingly.
- If a swap requires a minor adjustment, incorporate it (and mention in change_log).
- Do not add new ingredients unless absolutely necessary for coherence; if you must, note it in change_log.

Return strictly according to the schema.
"""

def rewrite_recipe(parsed: ParsedRecipe, swaps: list[SwapChoice]) -> RewrittenRecipe:
    swap_lines = "\n".join([f"- {s.original} -> {s.chosen}" for s in swaps])

    # Provide the full recipe context (still small enough for most recipes)
    ing_lines = []
    for ing in parsed.ingredients:
        q = f"{ing.quantity} " if ing.quantity else ""
        u = f"{ing.unit} " if ing.unit else ""
        n = f" ({ing.notes})" if ing.notes else ""
        ing_lines.append(f"- {q}{u}{ing.name}{n}")

    user = f"""Original title: {parsed.title or "Unknown"}
Original ingredients:
{chr(10).join(ing_lines)}

Original instructions:
{chr(10).join([f"{idx+1}. {step}" for idx, step in enumerate(parsed.instructions)])}

User-approved swaps:
{swap_lines}

Rewrite the recipe to reflect the swaps.
"""
    return call_structured(system=SYSTEM, user=user, schema=RewrittenRecipe)
