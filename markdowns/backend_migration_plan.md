# Backend Migration Plan — SousSwap

## Goals
- Convert the local demo pipeline into a backend that supports a front end.
- Preserve the serialized, ingredient-level decision flow.
- Enforce strict JSON schemas at every boundary.
- Keep the system as a decision-support editor (not a recipe generator).

## Current Flow (Source of Truth)
Pipeline in `src`:
- Parse recipe text into structured JSON.
- Annotate ingredients with role/stage/importance.
- Suggest substitutions per stage.
- Apply user swaps and rewrite the recipe.

## Target Backend Shape
- Language: Python (reuse existing modules).
- Framework: FastAPI with Pydantic models.
- Session-based orchestration (server retains recipe state per session).
- Cache and retry LLM calls with structured outputs.

## API Contracts (MVP)

### 1) Create Session
`POST /v1/sessions`
- Input:
  - `recipe_text: string`
  - `allowed_ingredients: string[]`
  - `goal: string | null`
  - `diet_profile: { name: string, instructions: string } | null`
  - `allow_out_of_list: boolean`
- Output:
  - `session_id: string`
  - `parsed_recipe: ParsedRecipe`
  - `annotated_recipe: AnnotatedRecipe`
  - `stage_order: ["primary", "secondary", "seasoning_optional"]`

### 2) Get Next Stage
`GET /v1/sessions/{id}/stage`
- Output:
  - `stage: Stage`
  - `ingredients: IngredientAnnotation[]` (sorted by importance)

### 3) Get Substitutions for Stage
`POST /v1/sessions/{id}/substitutions`
- Input:
  - `stage: Stage`
- Output:
  - `SubstitutionBatch`

### 4) Apply Swaps
`POST /v1/sessions/{id}/swaps`
- Input:
  - `swaps: SwapChoice[]`
- Output:
  - `rewritten_recipe: RewrittenRecipe`
  - `current_recipe: ParsedRecipe`
  - `swap_history: SwapChoice[]`

### 5) Read Current Recipe
`GET /v1/sessions/{id}/recipe`
- Output:
  - `current_recipe: ParsedRecipe`

## Session State Model (Stored Server-Side)
- `parsed_recipe`
- `annotated_recipe`
- `current_recipe`
- `allowed_ingredients`
- `goal`
- `diet_profile`
- `allow_out_of_list`
- `stage_progress`
- `swap_history`

Start with in-memory store; move to Redis for multi-instance support.

## Service Layer Design

### LLM Adapter
Keep existing prompt builders:
- `parse_recipe.py`
- `annotate_recipe.py`
- `suggest_substitutions.py`
- `rewrite_recipe.py`

Add a service wrapper for:
- timeouts
- retries (already present but centralized)
- caching of prompt+schema inputs
- structured error normalization

### Validation
Use `schemas.py` for both:
- internal model validation
- API request/response schemas (via FastAPI)

## Folder Layout (Proposed)
```
app/
  main.py
  routes/
    sessions.py
  services/
    llm_service.py
    session_store.py
    pipeline.py
  models/
    api.py
    core.py   # re-export from src/schemas.py or move them here
src/
  parse_recipe.py
  annotate_recipe.py
  suggest_substitutions.py
  rewrite_recipe.py
  llm_client.py
```

## Error Handling Strategy
- Schema violations: return 422 with validation details.
- LLM failures: return 503 with retryable flag.
- Missing session: return 404.
- Partial substitutions: return empty options or “keep original” fallback.

## Observability
- Log prompts, latency, model, and token usage (redact recipe text if needed).
- Track swap decisions and stage completion for analytics.

## Security and Ops
- API key remains server-side only.
- Basic rate limiting per IP or session.
- Environment-configured model name.

## Migration Steps
1) Create FastAPI scaffold and basic health endpoint.
2) Wrap existing functions into a `pipeline.py` service.
3) Implement session store (in-memory).
4) Add `POST /v1/sessions` and `POST /v1/sessions/{id}/substitutions`.
5) Add swap application and recipe read endpoints.
6) Add Redis + persistence (optional).
7) Integrate front end.

## Testing Plan (Minimal)
- Unit tests for session orchestration.
- Integration test for full flow:
  - parse → annotate → substitutions → swaps → rewrite
- Schema validation tests for all endpoints.

