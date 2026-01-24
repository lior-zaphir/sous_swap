from __future__ import annotations

import os
from typing import Any, Dict, List

import requests


API_BASE = os.getenv("SOUSSWAP_API_BASE", "http://127.0.0.1:8000")


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

DIET_PROFILES = {
    "0": ("None", "No additional dietary restrictions."),
    "1": (
        "Gluten Free",
        "Avoid all gluten-containing ingredients: wheat, barley, rye, spelt, farro, durum, semolina, "
        "bulgur, couscous, farina, malt, brewer's yeast, most soy sauce unless labeled gluten-free. "
        "Prefer gluten-free grains and starches (rice, corn, quinoa, buckwheat, certified GF oats). "
        "Do not suggest bread/pasta/flour unless explicitly gluten-free.",
    ),
    "2": (
        "Vegan",
        "Exclude all animal products: meat, poultry, fish/seafood, eggs, dairy, honey, gelatin. "
        "Prefer plant proteins (legumes, tofu/tempeh) and plant-based dairy alternatives.",
    ),
    "3": (
        "Vegetarian",
        "Exclude meat, poultry, fish/seafood, and gelatin. "
        "Dairy and eggs are allowed unless otherwise stated.",
    ),
    "4": (
        "Ketogenic",
        "Minimize carbs and sugars. Avoid grains, pasta, rice, bread, most starchy vegetables, "
        "and added sugars. Favor fats, proteins, and low-carb vegetables.",
    ),
    "5": (
        "Weight loss",
        "Favor lower-calorie, higher-satiety options. Avoid heavy creams, excessive oils/butter, "
        "and added sugars. Prefer lean proteins, vegetables, and lighter swaps.",
    ),
}


def prompt_choice(max_option: int) -> tuple[int, str]:
    while True:
        raw = input(f"Choose (0=keep, 1-{max_option}=swap, n+=add): ").strip().lower()
        if raw.endswith("+") and raw[:-1].isdigit():
            val = int(raw[:-1])
            if 1 <= val <= max_option:
                return val, "add"
        if raw.isdigit():
            val = int(raw)
            if 0 <= val <= max_option:
                return val, "swap"
        print("Invalid choice. Enter a number in range or use n+ to add.")


def render_options(options: List[Dict[str, Any]]) -> None:
    for idx, opt in enumerate(options, start=1):
        reason = opt.get("reason", "")
        confidence = opt.get("confidence", "")
        adj = opt.get("adjustment")
        diet_fit = opt.get("diet_fit")
        dish_fit = opt.get("dish_fit")
        suffix = f" | {reason}" if reason else ""
        if adj:
            suffix += f" (adj: {adj})"
        if diet_fit is not None and dish_fit is not None:
            suffix += f" [diet {diet_fit}/5, dish {dish_fit}/5]"
        if confidence:
            suffix += f" [{confidence}]"
        print(f"{idx}) {opt.get('substitute', '')}{suffix}")


def prompt_allow_out_of_list() -> bool:
    while True:
        raw = input("Allow suggestions outside your list? (y/n): ").strip().lower()
        if raw in {"y", "yes"}:
            return True
        if raw in {"n", "no"}:
            return False
        print("Please enter y or n.")


def prompt_diet_profile() -> Dict[str, str]:
    print("Select a dietary profile:")
    for key in sorted(DIET_PROFILES.keys(), key=int):
        print(f"{key}) {DIET_PROFILES[key][0]}")
    while True:
        raw = input("Choice: ").strip()
        if raw in DIET_PROFILES:
            name, instructions = DIET_PROFILES[raw]
            return {"name": name, "instructions": instructions}
        print("Invalid choice. Enter one of the listed numbers.")


def main() -> None:
    print(f"Using API base: {API_BASE}")
    print("\nInput recipe:")
    print(RECIPE_TEXT.strip())

    allow_out_of_list = prompt_allow_out_of_list()
    diet_profile = prompt_diet_profile()

    session_resp = requests.post(
        f"{API_BASE}/v1/sessions",
        json={
            "recipe_text": RECIPE_TEXT,
            "allowed_ingredients": [
                "spaghetti",
                "linguine",
                "garlic",
                "olive oil",
                "chili flakes",
                "parsley",
                "salt",
                "whole wheat pasta",
            ],
            "diet_profile": diet_profile,
            "allow_out_of_list": allow_out_of_list,
        },
        timeout=120,
    )
    session_resp.raise_for_status()
    session_data = session_resp.json()
    session_id = session_data["session_id"]
    print(f"\nSession created: {session_id}")

    while True:
        stage_resp = requests.get(f"{API_BASE}/v1/sessions/{session_id}/stage", timeout=60)
        if stage_resp.status_code == 404:
            break
        stage_resp.raise_for_status()
        stage_data = stage_resp.json()
        stage = stage_data["stage"]
        ingredients = stage_data.get("ingredients", [])

        print(f"\n=== Stage: {stage} ===")

        subs_resp = requests.post(
            f"{API_BASE}/v1/sessions/{session_id}/substitutions",
            json={"stage": stage},
            timeout=180,
        )
        subs_resp.raise_for_status()
        subs_data = subs_resp.json()
        items = {i["ingredient_name"].lower(): i for i in subs_data["batch"]["items"]}

        swaps = []
        for ann in ingredients:
            name = ann["ingredient_name"]
            item = items.get(name.lower())
            if not item or not item.get("options"):
                print(f"\nIngredient: {name}")
                print("No suggestions; keeping original.")
                continue

            print(f"\nIngredient: {name} ({ann['role']}, {ann['importance']})")
            render_options(item["options"])
            choice, action = prompt_choice(len(item["options"]))
            if choice == 0:
                continue
            chosen = item["options"][choice - 1]["substitute"]
            swaps.append({"original": name, "chosen": chosen, "action": action})

        swaps_resp = requests.post(
            f"{API_BASE}/v1/sessions/{session_id}/swaps",
            json={"swaps": swaps},
            timeout=180,
        )
        swaps_resp.raise_for_status()
        print(f"\nApplied swaps: {len(swaps)}")

    recipe_resp = requests.get(
        f"{API_BASE}/v1/sessions/{session_id}/recipe", timeout=60
    )
    recipe_resp.raise_for_status()
    recipe = recipe_resp.json().get("current_recipe", {})
    print("\nFinal recipe:")
    print(recipe.get("title") or "Untitled Recipe")
    print("Ingredients:")
    for ing in recipe.get("ingredients", []):
        q = f"{ing.get('quantity')} " if ing.get("quantity") else ""
        u = f"{ing.get('unit')} " if ing.get("unit") else ""
        n = f", {ing.get('notes')}" if ing.get("notes") else ""
        print(f"- {q}{u}{ing.get('name', '')}{n}".strip())
    print("Directions:")
    for step in recipe.get("instructions", []):
        print(f"- {step}")

    print("\nInput recipe (original):")
    print(RECIPE_TEXT.strip())


if __name__ == "__main__":
    main()
