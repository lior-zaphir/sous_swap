from __future__ import annotations

from html.parser import HTMLParser
import logging
from typing import List, Optional, Tuple
from urllib.parse import urljoin, urlparse

import requests

from app.models.core import ParsedRecipe, RecipePreview, RecipeSiteCandidate, SwapChoice
from src.find_recipe_sites import find_recipe_sites


logger = logging.getLogger("sousswap")


class MetadataParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.meta: dict[str, str] = {}
        self.title: Optional[str] = None
        self._in_title = False

    def handle_starttag(self, tag: str, attrs: List[tuple[str, Optional[str]]]) -> None:
        if tag.lower() == "meta":
            attr_map = {key.lower(): value for key, value in attrs if key}
            key = attr_map.get("property") or attr_map.get("name")
            content = attr_map.get("content")
            if key and content:
                self.meta[key.lower()] = content
        elif tag.lower() == "title":
            self._in_title = True

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "title":
            self._in_title = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title = (self.title or "") + data


def normalize_url(raw: str) -> Optional[str]:
    if not raw:
        return None
    trimmed = raw.strip().strip('"').strip("'")
    if not trimmed.startswith(("http://", "https://")):
        return None
    parsed = urlparse(trimmed)
    if not parsed.netloc:
        return None
    return trimmed


def _is_soft_404(title: Optional[str], description: Optional[str], body: str) -> bool:
    combined = " ".join(
        part for part in [title or "", description or "", body or ""] if part
    ).lower()
    markers = [
        "page not found",
        "not found",
        "error 404",
        "404 error",
        "404 not found",
        "page unavailable",
    ]
    return any(marker in combined for marker in markers)


def extract_preview(url: str, site_hint: Optional[str] = None) -> tuple[RecipePreview, bool]:
    headers = {"User-Agent": "SousSwap/1.0"}
    try:
        resp = requests.get(url, headers=headers, timeout=12, allow_redirects=True)
        resp.raise_for_status()
    except requests.HTTPError as error:
        status = None
        if error.response is not None:
            status = error.response.status_code
        logger.warning("recipe preview fetch failed url=%s status=%s", url, status)
        site_name = site_hint or urlparse(url).netloc
        return RecipePreview(url=url, site_name=site_name), False
    except Exception as error:
        logger.warning("recipe preview fetch error url=%s err=%s", url, error)
        site_name = site_hint or urlparse(url).netloc
        return RecipePreview(url=url, site_name=site_name), False

    parser = MetadataParser()
    parser.feed(resp.text)
    meta = parser.meta

    title = meta.get("og:title") or meta.get("twitter:title") or parser.title
    description = (
        meta.get("og:description") or meta.get("description") or meta.get("twitter:description")
    )
    image = meta.get("og:image") or meta.get("twitter:image")
    site_name = meta.get("og:site_name") or meta.get("twitter:site") or site_hint
    if site_name and site_name.startswith("@"):
        site_name = site_name[1:]
    if not site_name:
        site_name = urlparse(url).netloc

    if _is_soft_404(title, description, resp.text):
        logger.warning("recipe preview soft-404 url=%s", resp.url)
        site_name = site_name or urlparse(resp.url).netloc
        return RecipePreview(url=resp.url, site_name=site_name), False

    image_url = urljoin(resp.url, image) if image else None
    preview = RecipePreview(
        url=resp.url,
        title=title.strip() if title else None,
        site_name=site_name.strip() if site_name else None,
        description=description.strip() if description else None,
        image_url=image_url,
    )
    return preview, True


def choose_candidate_urls(
    candidates: List[RecipeSiteCandidate],
    limit: int,
) -> List[RecipeSiteCandidate]:
    seen: set[str] = set()
    output: List[RecipeSiteCandidate] = []
    for candidate in candidates:
        normalized = normalize_url(candidate.url)
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        output.append(candidate)
        if len(output) >= limit:
            break
    return output


def build_recipe_previews(
    parsed: ParsedRecipe,
    swaps: List[SwapChoice],
    limit: int = 5,
) -> Tuple[List[RecipePreview], List[str]]:
    if limit <= 0:
        return [], []
    used_ingredients: List[str] = []
    seen_used: set[str] = set()
    for swap in swaps:
        name = (swap.chosen or "").strip()
        key = name.lower()
        if not name or key in seen_used:
            continue
        seen_used.add(key)
        used_ingredients.append(name)
    candidate_list = find_recipe_sites(parsed, swaps, limit=limit * 3)
    candidates = choose_candidate_urls(candidate_list.items, limit * 3)

    previews: List[RecipePreview] = []
    failures: List[str] = []
    for candidate in candidates:
        preview, ok = extract_preview(candidate.url, candidate.site_name)
        if not ok:
            failures.append(candidate.url)
            continue
        if used_ingredients:
            preview.used_ingredients = list(used_ingredients)
        previews.append(preview)
        if len(previews) >= limit:
            break
    return previews, failures
