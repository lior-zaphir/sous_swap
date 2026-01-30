from __future__ import annotations

from typing import List

from src.llm_client import call_structured
from src.schemas import ParsedRecipe, RecipeSearchQuery, RecipeSiteList, SwapChoice
from src.web_search import search_recipe_urls

SYSTEM = """You provide URLs of existing recipe pages that match a modified ingredient set.

Rules:
- Return only real, publicly accessible recipe page URLs (not search pages, categories, or homepages).
- Use full https:// URLs.
- Prefer well-known recipe sites.
- The recipes must already use the substituted ingredients.
- The recipes must be meaningfully different from the original recipe (avoid near-duplicates of the same dish or title).
- For swap actions, the recipe MUST include the swapped-in ingredient and should NOT include the swapped-out ingredient.
- For add actions, the recipe MUST include the added ingredient in addition to the original.
- If unsure about a URL, omit it.
- Return at most 5 items.
"""

QUERY_SYSTEM = """You write a concise web search query to find existing recipe pages.

Rules:
- Include the dish name and the swapped-in ingredients.
- Exclude swapped-out ingredients using negative keywords (prefix with -).
- Keep it short (under 12 words).
- Return only the query string.
"""


def normalize_url(value: str) -> str:
    url = value.strip().strip('"').strip("'")
    if not url:
        return ""
    if url.startswith("http://") or url.startswith("https://"):
        return url
    if url.startswith("//"):
        return f"https:{url}"
    if url.startswith("www."):
        return f"https://{url}"
    return f"https://{url}"


def find_recipe_sites(
    parsed: ParsedRecipe,
    swaps: List[SwapChoice],
    limit: int = 5,
) -> RecipeSiteList:
    top_ingredients = ", ".join([ing.name for ing in parsed.ingredients][:16])
    swap_lines = "\n".join(
        f"- {swap.original} -> {swap.chosen} ({swap.action})" for swap in swaps
    ) or "- none"
    swapped_in = ", ".join([swap.chosen for swap in swaps]) or "none"
    swapped_out = ", ".join(
        [swap.original for swap in swaps if swap.action == "swap"]
    ) or "none"
    added_only = ", ".join([swap.chosen for swap in swaps if swap.action == "add"]) or "none"
    query_prompt = f"""Title: {parsed.title or "Unknown"}
Swaps:
{swap_lines}
Swapped-in ingredients: {swapped_in}
Swapped-out ingredients: {swapped_out}
Added ingredients: {added_only}
Key ingredients: {top_ingredients}
"""
    query = call_structured(system=QUERY_SYSTEM, user=query_prompt, schema=RecipeSearchQuery)
    urls = search_recipe_urls(query.query, limit=limit * 3)
    search_results = "\n".join(f"- {url}" for url in urls) or "none"
    user = f"""Recipe title: {parsed.title or "Unknown"}
Key ingredients: {top_ingredients}
Original ingredients (subset): {top_ingredients}
Swaps made:
{swap_lines}
Swapped-in ingredients (must appear): {swapped_in}
Swapped-out ingredients for swaps (must NOT appear): {swapped_out}
Added ingredients (must appear alongside originals): {added_only}

Search results (authoritative sources; pick real URLs from here when possible):
{search_results or "none"}

Return up to {limit} recipe page URLs that already use the swapped ingredients and are not the original recipe.
"""
    result = call_structured(system=SYSTEM, user=user, schema=RecipeSiteList)
    for item in result.items:
        item.url = normalize_url(item.url)
    result.items = [item for item in result.items if item.url]
    return result
