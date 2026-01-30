# llm_client.py
from __future__ import annotations

import os
import time
import random
from typing import Type, TypeVar, Optional

from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel, ValidationError

T = TypeVar("T", bound=BaseModel)

load_dotenv()

DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")  # fast + cheap for POC

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class LLMError(RuntimeError):
    pass


def call_structured(
    *,
    system: str,
    user: str,
    schema: Type[T],
    model: str = DEFAULT_MODEL,
    max_retries: int = 3,
    temperature: float = 0.2,
    timeout_s: Optional[float] = None,
) -> T:
    """
    Calls OpenAI Responses API with Structured Outputs and returns a Pydantic model instance.
    Uses lightweight retries for transient failures and schema issues.
    """
    last_err: Exception | None = None

    for attempt in range(max_retries):
        try:
            # responses.parse returns response.output_parsed (Pydantic instance)
            resp = client.responses.parse(
                model=model,
                input=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                text_format=schema,
                temperature=temperature,
                # If your SDK version supports it, you can set timeout via http client config.
            )
            parsed = resp.output_parsed
            if parsed is None:
                raise LLMError("Model returned no parsed output.")
            return parsed

        except (ValidationError, LLMError) as e:
            # schema mismatch or empty
            last_err = e
        except Exception as e:
            # transient HTTP/API errors
            last_err = e

        # exponential backoff with jitter
        sleep = (2**attempt) + random.random()
        time.sleep(sleep)

    raise LLMError(f"Structured call failed after {max_retries} retries: {last_err}")


def run_web_search(query: str, *, model: str = DEFAULT_MODEL) -> str:
    """
    Uses the OpenAI web search tool (if available) and returns a text summary.
    """
    try:
        resp = client.responses.create(
            model=model,
            input=[{"role": "user", "content": query}],
            tools=[{"type": "web_search_preview"}],
            temperature=0.2,
        )
        output_text = getattr(resp, "output_text", None)
        if output_text:
            return output_text
        # Fallback for SDK variants: try concatenating text outputs.
        parts: list[str] = []
        for item in getattr(resp, "output", []) or []:
            for content in getattr(item, "content", []) or []:
                text = getattr(content, "text", None)
                if text:
                    parts.append(text)
        return "\n".join(parts)
    except Exception as exc:
        raise LLMError(f"Web search call failed: {exc}") from exc
