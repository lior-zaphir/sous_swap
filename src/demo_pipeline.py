# demo_pipeline.py
from __future__ import annotations

from src.parse_recipe import parse_recipe
from src.annotate_recipe import annotate_recipe
from src.suggest_substitutions import suggest_substitutions_batch
from src.rewrite_recipe import rewrite_recipe

from src.schemas import SwapChoice, SubstitutionOption
import re

RECIPE_TEXT = """Spaghetti Aglio e Olio
No two aglio e olio recipes are alike, but this one is pretty true to the classic method. The key is slowly toasting the garlic slices to a perfect golden brown in the olive oil. If it's too light, you don't get the full flavor and if it's too dark it gets bitter. My advice? Do it perfectly.

By John Mitzewich
Prep Time: 10 mins
Cook Time: 15 mins
Total Time: 25 mins
Servings: 4
Ingredients
1 pound uncooked spaghetti

1/2 cup olive oil

6 cloves garlic, thinly sliced

1/4 teaspoon red pepper flakes, or to taste

salt and freshly ground black pepper to taste

1/4 cup chopped fresh Italian parsley

1 cup finely grated Parmigiano-Reggiano cheese

Directions
Gather all ingredients.

Bring a large pot of lightly salted water to a boil. Cook spaghetti in the boiling water, stirring occasionally until cooked through but firm to the bite, about 10 to 12 minutes. Drain and transfer to a pasta bowl.

While the pasta is cooking, combine olive oil and garlic in a cold skillet.

Cook over medium heat to slowly toast garlic, about 10 minutes. Reduce heat to medium-low when olive oil begins to bubble. Cook and stir until garlic is golden brown, about another 5 minutes. Remove from heat.

Stir red pepper flakes, salt, and black pepper into pasta.

Pour in hot olive oil and garlic, and sprinkle on Italian parsley and half of the Parmigiano-Reggiano cheese; toss until combined.

Serve pasta topped with the remaining Parmigiano-Reggiano cheese.

Recipe Tip
It's not traditional, but for extra richness, add 1 tablespoon butter when you toss pasta with cheese.
"""

ALLOWED = ["spaghetti", "linguine", "garlic", "olive oil", "chili flakes", "parsley", "salt", "whole wheat pasta"]

STAGE_ORDER = {"primary": 0, "secondary": 1, "seasoning_optional": 2}
IMPORTANCE_ORDER = {"must": 0, "should": 1, "optional": 2}

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

def normalize_name(value: str) -> str:
    name = value.lower()
    name = re.sub(r"\(.*?\)", "", name)
    name = name.replace("original", "")
    name = re.sub(r"[^a-z\s]", "", name)
    return " ".join(name.split())

def prompt_choice(target: str, options: list[str]) -> int:
    while True:
        raw = input(f"Choose for '{target}' (0=keep, 1-{len(options)}=swap): ").strip()
        if raw.isdigit():
            idx = int(raw)
            if 0 <= idx <= len(options):
                return idx
        print("Invalid choice. Enter a number in range.")

def prompt_allow_out_of_list() -> bool:
    while True:
        raw = input("Allow suggestions outside your allowed list? (y/n): ").strip().lower()
        if raw in {"y", "yes"}:
            return True
        if raw in {"n", "no"}:
            return False
        print("Please enter y or n.")

DIET_PROFILES = {
    1: ("Gluten Free", (
        "Avoid all gluten-containing ingredients: wheat, barley, rye, spelt, farro, durum, semolina, "
        "bulgur, couscous, farina, malt, brewer's yeast, most soy sauce unless labeled gluten-free. "
        "Prefer gluten-free grains and starches (rice, corn, quinoa, buckwheat, certified GF oats). "
        "Do not suggest bread/pasta/flour unless explicitly gluten-free."
    )),
    2: ("Vegan", (
        "Exclude all animal products: meat, poultry, fish/seafood, eggs, dairy, honey, gelatin. "
        "Prefer plant proteins (legumes, tofu/tempeh) and plant-based dairy alternatives."
    )),
    3: ("Vegetarian", (
        "Exclude meat, poultry, fish/seafood, and gelatin. "
        "Dairy and eggs are allowed unless otherwise stated."
    )),
    4: ("Ketogenic", (
        "Minimize carbs and sugars. Avoid grains, pasta, rice, bread, most starchy vegetables, "
        "and added sugars. Favor fats, proteins, and low-carb vegetables."
    )),
    5: ("Weight loss", (
        "Favor lower-calorie, higher-satiety options. Avoid heavy creams, excessive oils/butter, "
        "and added sugars. Prefer lean proteins, vegetables, and lighter swaps."
    )),
    0: ("None", "No additional dietary restrictions."),
}

def prompt_diet_profile() -> tuple[str, str]:
    print("Select a dietary profile:")
    for key in sorted(DIET_PROFILES.keys()):
        name, _ = DIET_PROFILES[key]
        print(f"{key}) {name}")
    while True:
        raw = input("Choice: ").strip()
        if raw.isdigit():
            key = int(raw)
            if key in DIET_PROFILES:
                return DIET_PROFILES[key]
        print("Invalid choice. Enter one of the listed numbers.")

def add_fallback_options(subs, target: str, role: str, allowed: list[str], min_options: int = 2) -> None:
    if len(subs.options) >= min_options:
        return
    existing = {opt.substitute.lower() for opt in subs.options}
    keywords = ROLE_KEYWORDS.get(role, [])
    candidates = [
        a for a in allowed
        if a.lower() != target.lower() and a.lower() not in existing
    ]
    if keywords:
        candidates = [c for c in candidates if any(k in c.lower() for k in keywords)]
    if not candidates:
        return
    needed = min_options - len(subs.options)
    for cand in candidates[:needed]:
        subs.options.append(
            SubstitutionOption(
                substitute=cand,
                reason=f"Allowed ingredient (role-matched fallback) that may work as a {role} substitute.",
                adjustment=None,
                confidence="low",
            )
        )

def format_recipe(title: str | None, servings: str | None, ingredients: list, instructions: list[str]) -> str:
    lines: list[str] = []
    lines.append(title or "Untitled Recipe")
    if servings:
        lines.append(f"Servings: {servings}")
    lines.append("Ingredients")
    for ing in ingredients:
        q = f"{ing.quantity} " if ing.quantity else ""
        u = f"{ing.unit} " if ing.unit else ""
        n = f", {ing.notes}" if ing.notes else ""
        lines.append(f"{q}{u}{ing.name}{n}".strip())
        lines.append("")
    lines.append("Directions")
    for step in instructions:
        lines.append(step)
        lines.append("")
    return "\n".join(lines).strip()

def main():
    allow_out_of_list = prompt_allow_out_of_list()
    diet_name, diet_instructions = prompt_diet_profile()
    print("Parsing recipe...")
    parsed = parse_recipe(RECIPE_TEXT)
    print("\nParsed recipe:")
    print(format_recipe(parsed.title, parsed.servings, parsed.ingredients, parsed.instructions))
    print("Annotating ingredients...")
    annotated = annotate_recipe(parsed)

    stages = ["primary", "secondary", "seasoning_optional"]
    swaps: list[SwapChoice] = []
    current = parsed
    for stage in stages:
        stage_anns = [a for a in annotated.ingredients if a.stage == stage]
        stage_anns = sorted(stage_anns, key=lambda a: IMPORTANCE_ORDER.get(a.importance, 99))
        if not stage_anns:
            continue

        print(f"\n=== Stage: {stage} ===")
        print("Generating substitutions for this stage...")
        batch = suggest_substitutions_batch(
            current,
            stage_anns,
            allowed_ingredients=ALLOWED,
            goal="healthier",
            diet_name=diet_name,
            diet_instructions=diet_instructions,
            allow_out_of_list=allow_out_of_list,
        )

        by_name = {item.ingredient_name.lower(): item for item in batch.items}
        stage_swaps: list[SwapChoice] = []

        for ann in stage_anns:
            target = ann.ingredient_name
            subs = by_name.get(target.lower())
            if subs is None:
                print(f"\nIngredient: {target}")
                print("No suggestions returned; keeping original.")
                continue

            # Keep only allowed options; remove the original if other options remain.
            if allow_out_of_list:
                filtered_options = [
                    opt for opt in subs.options
                    if normalize_name(opt.substitute) != normalize_name(target)
                ]
            else:
                allowed_set = {a.lower() for a in ALLOWED}
                filtered_options = [
                    opt for opt in subs.options
                    if opt.substitute.lower() in allowed_set
                    and normalize_name(opt.substitute) != normalize_name(target)
                ]
            if filtered_options:
                subs.options = filtered_options
            else:
                # Fall back to keeping original if nothing allowed is suggested.
                subs.options = []
                print(f"\nIngredient: {target}")
                print("No allowed substitutes suggested; keeping original.")
                continue
            add_fallback_options(subs, target, ann.role, ALLOWED, min_options=2)

            def weighted_score(opt: SubstitutionOption) -> float:
                return (0.7 * opt.dish_fit) + (0.3 * opt.diet_fit)

            subs.options = sorted(
                subs.options,
                key=lambda o: (weighted_score(o), o.confidence),
                reverse=True,
            )

            print(f"\nIngredient: {target}")
            print(f"Role: {ann.role} | Stage: {ann.stage} | Importance: {ann.importance}")
            for idx, opt in enumerate(subs.options, start=1):
                adj = f" | Adjustment: {opt.adjustment}" if opt.adjustment else ""
                print(
                    f"{idx}) {opt.substitute} — {opt.reason} "
                    f"(diet fit: {opt.diet_fit}/5, dish fit: {opt.dish_fit}/5, "
                    f"confidence: {opt.confidence}){adj}"
                )

            choice = prompt_choice(target, [o.substitute for o in subs.options])
            if choice == 0:
                continue
            chosen = subs.options[choice - 1].substitute
            stage_swaps.append(SwapChoice(original=target, chosen=chosen))

        if stage_swaps:
            swaps.extend(stage_swaps)
            rewritten = rewrite_recipe(current, swaps=stage_swaps)
            current = parsed.__class__(
                title=rewritten.title,
                servings=parsed.servings,
                ingredients=rewritten.ingredients,
                instructions=rewritten.instructions,
            )

    rewritten = rewrite_recipe(current, swaps=[])
    print("\nRewritten recipe:")
    print(format_recipe(rewritten.title, parsed.servings, rewritten.ingredients, rewritten.instructions))

if __name__ == "__main__":
    main()
