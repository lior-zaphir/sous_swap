from __future__ import annotations

import logging
from html.parser import HTMLParser
from typing import List
from urllib.parse import parse_qs, urlparse, unquote

import requests

logger = logging.getLogger("sousswap")


class DuckDuckGoParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: List[str] = []

    def handle_starttag(self, tag: str, attrs: List[tuple[str, str | None]]) -> None:
        if tag.lower() != "a":
            return
        attr_map = {key.lower(): value or "" for key, value in attrs if key}
        href = attr_map.get("href", "")
        class_name = attr_map.get("class", "")
        if href and "result__a" in class_name:
            self.links.append(href)


def _normalize_ddg_url(href: str) -> str:
    value = href.strip()
    if not value:
        return ""
    if value.startswith("/l/"):
        parsed = urlparse(value)
        params = parse_qs(parsed.query)
        if "uddg" in params:
            return unquote(params["uddg"][0])
    if value.startswith("http://") or value.startswith("https://"):
        return value
    if value.startswith("//"):
        return f"https:{value}"
    return ""


def search_recipe_urls(query: str, limit: int = 10) -> List[str]:
    if not query:
        return []
    url = "https://duckduckgo.com/html/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    }
    try:
        resp = requests.get(url, params={"q": query}, headers=headers, timeout=12)
        resp.raise_for_status()
    except Exception as exc:
        logger.warning("duckduckgo search failed query=%s err=%s", query, exc)
        return []

    parser = DuckDuckGoParser()
    parser.feed(resp.text)

    results: List[str] = []
    seen: set[str] = set()
    for href in parser.links:
        normalized = _normalize_ddg_url(href)
        if not normalized:
            continue
        if normalized in seen:
            continue
        seen.add(normalized)
        results.append(normalized)
        if len(results) >= limit:
            break

    return results
