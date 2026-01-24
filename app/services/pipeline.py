from __future__ import annotations

from typing import List, Optional
import re

from app.models.core import (
    AnnotatedRecipe,
    ParsedRecipe,
    RewrittenRecipe,
    Stage,
    SwapChoice,
    SubstitutionBatch,
    SubstitutionOption,
)
from src.annotate_recipe import annotate_recipe
from src.parse_recipe import parse_recipe
from src.rewrite_recipe import rewrite_recipe
from src.suggest_substitutions import suggest_substitutions_batch


IMPORTANCE_ORDER = {"must": 0, "should": 1, "optional": 2}
CONFIDENCE_ORDER = {"low": 1, "medium": 2, "high": 3}

ROLE_KEYWORDS = {
    "base_starch": ["pasta", "noodle", "rice", "grain", "flour", "bread", "tortilla", "quinoa", "couscous", "potato"],
    "protein": ["chicken", "beef", "pork", "tofu", "tempeh", "fish", "shrimp", "egg", "lentil", "bean", "turkey"],
    "vegetable": ["carrot", "broccoli", "spinach", "pepper", "tomato", "zucchini", "mushroom", "onion"],
    "sauce_liquid": ["broth", "stock", "sauce", "milk", "cream", "wine", "tomato", "coconut"],
    "fat": ["oil", "butter", "ghee", "lard"],
    "aromatic": ["garlic", "onion", "shallot", "ginger", "scallion", "leek"],
    "spice_herb": ["pepper", "chili", "paprika", "cumin", "coriander", "basil", "oregano", "thyme", "parsley", "cilantro", "dill", "rosemary"],
    "sweetener": ["sugar", "honey", "maple", "syrup", "agave"],
    "acid": ["vinegar", "lemon", "lime"],
    "binder_thickener": ["flour", "cornstarch", "starch", "roux", "egg", "gelatin"],
    "dairy": ["cheese", "milk", "cream", "yogurt", "butter"],
    "garnish": ["parsley", "cilantro", "scallion", "chive", "sesame", "nut"],
    "other": [],
}


def run_parse(recipe_text: str) -> ParsedRecipe:
    return parse_recipe(recipe_text)


def run_annotate(parsed: ParsedRecipe) -> AnnotatedRecipe:
    return annotate_recipe(parsed)


def stage_annotations(annotated: AnnotatedRecipe, stage: Stage) -> List:
    stage_anns = [a for a in annotated.ingredients if a.stage == stage]
    return sorted(stage_anns, key=lambda a: IMPORTANCE_ORDER.get(a.importance, 99))


def normalize_name(value: str) -> str:
    name = value.lower()
    name = re.sub(r"\(.*?\)", "", name)
    name = name.replace("original", "")
    name = re.sub(r"[^a-z\s]", "", name)
    return " ".join(name.split())


def weighted_score(option: SubstitutionOption) -> float:
    return (0.7 * option.dish_fit) + (0.3 * option.diet_fit)


def add_fallback_options(
    *,
    options: List[SubstitutionOption],
    target: str,
    role: str,
    allowed: List[str],
    min_options: int = 3,
) -> List[SubstitutionOption]:
    if len(options) >= min_options:
        return options

    existing = {normalize_name(opt.substitute) for opt in options}
    keywords = ROLE_KEYWORDS.get(role, [])
    candidates = [
        a for a in allowed
        if normalize_name(a) != normalize_name(target) and normalize_name(a) not in existing
    ]
    if keywords:
        candidates = [c for c in candidates if any(k in c.lower() for k in keywords)]
    if not candidates:
        return options

    needed = min(min_options, 5) - len(options)
    for cand in candidates[:needed]:
        options.append(
            SubstitutionOption(
                substitute=cand,
                reason=f"Allowed ingredient (role-matched fallback) that may work as a {role} substitute.",
                adjustment=None,
                confidence="low",
                diet_fit=3,
                dish_fit=3,
            )
        )
    return options


def postprocess_batch(
    batch: SubstitutionBatch,
    annotations: List,
    *,
    allowed_ingredients: List[str],
    allow_out_of_list: bool,
) -> SubstitutionBatch:
    ann_by_name = {a.ingredient_name.lower(): a for a in annotations}
    allowed_set = {normalize_name(a) for a in allowed_ingredients}

    for item in batch.items:
        target = item.ingredient_name
        ann = ann_by_name.get(target.lower())
        role = ann.role if ann else "other"

        original_option: Optional[SubstitutionOption] = None
        for opt in item.options:
            if normalize_name(opt.substitute) == normalize_name(target):
                original_option = opt
                break

        filtered = [
            opt for opt in item.options
            if normalize_name(opt.substitute) != normalize_name(target)
        ]
        if not allow_out_of_list:
            filtered = [
                opt for opt in filtered
                if normalize_name(opt.substitute) in allowed_set
            ]

        if not filtered:
            if original_option:
                filtered = [original_option]
            else:
                filtered = [
                    SubstitutionOption(
                        substitute=target,
                        reason="No allowed substitutes suggested; keeping original.",
                        adjustment=None,
                        confidence="low",
                        diet_fit=3,
                        dish_fit=3,
                    )
                ]

        filtered = add_fallback_options(
            options=filtered,
            target=target,
            role=role,
            allowed=allowed_ingredients,
            min_options=3,
        )

        item.options = sorted(
            filtered,
            key=lambda o: (weighted_score(o), CONFIDENCE_ORDER.get(o.confidence, 0)),
            reverse=True,
        )

    return batch


def run_substitutions(
    parsed: ParsedRecipe,
    annotations: List,
    *,
    allowed_ingredients: List[str],
    goal: str | None,
    diet_name: str | None,
    diet_instructions: str | None,
    allow_out_of_list: bool,
) -> SubstitutionBatch:
    batch = suggest_substitutions_batch(
        parsed,
        annotations,
        allowed_ingredients=allowed_ingredients,
        goal=goal,
        diet_name=diet_name,
        diet_instructions=diet_instructions,
        allow_out_of_list=allow_out_of_list,
    )
    return postprocess_batch(
        batch,
        annotations,
        allowed_ingredients=allowed_ingredients,
        allow_out_of_list=allow_out_of_list,
    )


def run_rewrite(parsed: ParsedRecipe, swaps: List[SwapChoice]) -> RewrittenRecipe:
    return rewrite_recipe(parsed, swaps=swaps)


def rewritten_to_parsed(rewritten: RewrittenRecipe) -> ParsedRecipe:
    return ParsedRecipe(
        title=rewritten.title,
        servings=None,
        ingredients=rewritten.ingredients,
        instructions=rewritten.instructions,
    )
