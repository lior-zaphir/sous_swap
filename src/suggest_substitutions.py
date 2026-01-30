# suggest_substitutions.py
from __future__ import annotations
from typing import List, Optional
from src.llm_client import call_structured
from src.schemas import ParsedRecipe, IngredientAnnotation, SubstitutionSet, SubstitutionBatch

ROLE_KEYWORDS = {
    "base_starch": [
        "pasta",
        "noodle",
        "rice",
        "grain",
        "flour",
        "bread",
        "tortilla",
        "quinoa",
        "couscous",
        "potato",
        "spaghetti",
        "linguine",
        "fettuccine",
        "penne",
        "rigatoni",
        "fusilli",
        "farfalle",
        "macaroni",
        "bucatini",
        "vermicelli",
        "tagliatelle",
        "angel hair",
        "orzo",
        "udon",
        "soba",
        "ramen",
        "gnocchi",
    ],
    "protein": ["chicken", "beef", "pork", "tofu", "tempeh", "fish", "shrimp", "egg", "lentil", "bean", "turkey"],
    "vegetable": ["carrot", "broccoli", "spinach", "pepper", "tomato", "zucchini", "mushroom", "onion"],
    "sauce_liquid": ["broth", "stock", "sauce", "milk", "cream", "wine", "tomato", "coconut"],
    "fat": ["oil", "butter", "ghee", "lard"],
    "aromatic": ["garlic", "onion", "shallot", "ginger", "scallion", "leek"],
    "spice_herb": ["salt", "pepper", "chili", "paprika", "cumin", "coriander", "basil", "oregano", "thyme", "parsley", "cilantro", "dill", "rosemary"],
    "sweetener": ["sugar", "honey", "maple", "syrup", "agave"],
    "acid": ["vinegar", "lemon", "lime"],
    "binder_thickener": ["flour", "cornstarch", "starch", "roux", "egg", "gelatin"],
    "dairy": ["cheese", "milk", "cream", "yogurt", "butter"],
    "garnish": ["parsley", "cilantro", "scallion", "chive", "sesame", "nut"],
    "other": [],
}

SYSTEM = """You propose ingredient substitutions for a specific recipe ingredient.

Hard rules:
- Return at most 5 options.
- Each option must keep the ingredient's FUNCTION in the recipe (e.g., thickener vs aromatic).
- Each option MUST stay within the same ingredient class as the target (e.g., pasta swaps only with other pastas/noodles; fats with fats; herbs with herbs).
- Do NOT propose unrelated ingredients or change the dish type.
- Indirect substitutions (e.g., "add more pasta to account for the lack of cheese") must NOT be included as substitutions.
- Each option must be a direct replacement for the target ingredient, not for any other ingredient in the recipe.
- Do NOT mention other ingredient names as the substitution target (e.g., don't explain a cheese swap by talking about pasta).
- If no good substitutes exist, return 1 option: the original ingredient itself, with low confidence and explanation.
- Do NOT include the original ingredient if you can propose any other valid options.
- Rank options by how well they satisfy the dietary rules and goal, best first.
- Provide unique tie-break ranks for the best dish fit and best diet fit so only one option is #1 for each.

Output must be valid and complete per the schema.
"""

def suggest_substitutions(
    parsed: ParsedRecipe,
    annotation: IngredientAnnotation,
    target_ingredient: str,
    allowed_ingredients: List[str],
    goal: Optional[str] = None,  # e.g., "healthier", "vegan", "lower-calorie"
    diet_name: Optional[str] = None,
    diet_instructions: Optional[str] = None,
    allow_out_of_list: bool = False,
) -> SubstitutionSet:
    # Provide minimal recipe context: title + top ingredients + short instruction excerpt
    top_ings = [i.name for i in parsed.ingredients][:12]
    instr_excerpt = "\n".join(parsed.instructions[:3])

    user = f"""Recipe title: {parsed.title or "Unknown"}
Recipe key ingredients (unordered): {", ".join(top_ings)}
Instruction excerpt:
{instr_excerpt}

Target ingredient: {target_ingredient}
Its labeled role: {annotation.role}
Its stage: {annotation.stage}
Importance: {annotation.importance}

User allowed ingredients (prefer these): {", ".join(allowed_ingredients)}
Allowed list strictness: {"allow outside list" if allow_out_of_list else "only use allowed ingredients"}
Allowed-list rule: {"You MAY include ingredients not in the allowed list." if allow_out_of_list else "You MUST ONLY use ingredients from the allowed list."}
Ingredient class keywords for this role (use as a guardrail, not a literal-match requirement): {", ".join(ROLE_KEYWORDS.get(annotation.role, []))}

Goal (optional): {goal or "none"}
Dietary profile: {diet_name or "none"}
Dietary rules (must respect):
{diet_instructions or "none"}

Provide 3-5 substitution options with:
- substitute (canonical name)
- reason (functional and dish-cohesion, in-context)
- adjustment (optional)
- confidence
- diet_fit (1-5, how well it fits the dietary profile)
- dish_fit (1-5, how well it preserves the dish style/cohesion)
- diet_fit_rank (1=best diet fit, unique across the list; use it to break ties)
- dish_fit_rank (1=best dish fit, unique across the list; use it to break ties)
"""
    return call_structured(system=SYSTEM, user=user, schema=SubstitutionSet)


def suggest_substitutions_batch(
    parsed: ParsedRecipe,
    annotations: List[IngredientAnnotation],
    allowed_ingredients: List[str],
    goal: Optional[str] = None,  # e.g., "healthier", "vegan", "lower-calorie"
    diet_name: Optional[str] = None,
    diet_instructions: Optional[str] = None,
    allow_out_of_list: bool = False,
) -> SubstitutionBatch:
    # Provide minimal recipe context: title + top ingredients + short instruction excerpt
    top_ings = [i.name for i in parsed.ingredients][:12]
    instr_excerpt = "\n".join(parsed.instructions[:3])

    targets = "\n".join(
        [
            f"- {a.ingredient_name} | role={a.role} | stage={a.stage} | importance={a.importance}"
            for a in annotations
        ]
    )

    user = f"""Recipe title: {parsed.title or "Unknown"}
Recipe key ingredients (unordered): {", ".join(top_ings)}
Instruction excerpt:
{instr_excerpt}

Target ingredients (return one SubstitutionSet per item):
{targets}

User allowed ingredients (prefer these): {", ".join(allowed_ingredients)}
Allowed list strictness: {"allow outside list" if allow_out_of_list else "only use allowed ingredients"}
Allowed-list rule: {"You MAY include ingredients not in the allowed list." if allow_out_of_list else "You MUST ONLY use ingredients from the allowed list."}

Goal (optional): {goal or "none"}
Dietary profile: {diet_name or "none"}
Dietary rules (must respect):
{diet_instructions or "none"}

Provide 3-5 substitution options per target with:
- substitute (canonical name)
- reason (functional and dish-cohesion, in-context)
- adjustment (optional)
- confidence
- diet_fit (1-5, how well it fits the dietary profile)
- dish_fit (1-5, how well it preserves the dish style/cohesion)
- diet_fit_rank (1=best diet fit, unique across the list; use it to break ties)
- dish_fit_rank (1=best dish fit, unique across the list; use it to break ties)
"""
    return call_structured(system=SYSTEM, user=user, schema=SubstitutionBatch)
