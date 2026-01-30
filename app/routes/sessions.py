from __future__ import annotations

from fastapi import APIRouter, HTTPException
import logging

from app.models.api import (
    ApplySwapsRequest,
    ApplySwapsResponse,
    CreateSessionRequest,
    CreateSessionResponse,
    FinalizeRequest,
    RecipePreviewResponse,
    StageResponse,
    SubstitutionsRequest,
    SubstitutionsResponse,
)
from app.models.core import RewrittenRecipe
from app.services.pipeline import (
    run_annotate,
    run_parse,
    run_rewrite,
    run_substitutions,
    precompute_substitutions,
    stage_annotations,
    rewritten_to_parsed,
)
from app.services.web_recipes import build_recipe_previews
from app.services.session_store import InMemorySessionStore, SessionState


logger = logging.getLogger("sousswap")
router = APIRouter(tags=["sessions"])
store = InMemorySessionStore()


@router.post("/sessions", response_model=CreateSessionResponse)
def create_session(payload: CreateSessionRequest) -> CreateSessionResponse:
    logger.info("create_session preload_substitutions=%s", payload.preload_substitutions)
    parsed = run_parse(payload.recipe_text)
    annotated = run_annotate(parsed)
    state = SessionState(
        parsed_recipe=parsed,
        annotated_recipe=annotated,
        current_recipe=parsed,
        allowed_ingredients=payload.allowed_ingredients,
        diet_name=payload.diet_profile.name if payload.diet_profile else None,
        diet_instructions=payload.diet_profile.instructions if payload.diet_profile else None,
        allow_out_of_list=payload.allow_out_of_list,
        precomputed_substitutions=None,
    )
    if payload.preload_substitutions:
        logger.info("precomputing substitutions for session")
        state.precomputed_substitutions = precompute_substitutions(
            parsed,
            annotated,
            allowed_ingredients=payload.allowed_ingredients,
            diet_name=state.diet_name,
            diet_instructions=state.diet_instructions,
            allow_out_of_list=state.allow_out_of_list,
        )
    session_id = store.create(state)
    return CreateSessionResponse(
        session_id=session_id,
        parsed_recipe=parsed,
        annotated_recipe=annotated,
        stage_order=state.stage_order,
        precomputed_substitutions=state.precomputed_substitutions,
    )


@router.get("/sessions/{session_id}/stage", response_model=StageResponse)
def get_stage(session_id: str) -> StageResponse:
    state = store.get(session_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Session not found")

    stage = state.current_stage()
    if stage is None:
        raise HTTPException(status_code=404, detail="No remaining stages")

    ingredients = stage_annotations(state.annotated_recipe, stage)
    return StageResponse(stage=stage, ingredients=ingredients)


@router.post("/sessions/{session_id}/substitutions", response_model=SubstitutionsResponse)
def get_substitutions(
    session_id: str, payload: SubstitutionsRequest
) -> SubstitutionsResponse:
    state = store.get(session_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Session not found")

    annotations = stage_annotations(state.annotated_recipe, payload.stage)
    if state.precomputed_substitutions and payload.stage in state.precomputed_substitutions:
        logger.info("substitutions precomputed session=%s stage=%s", session_id, payload.stage)
        return SubstitutionsResponse(batch=state.precomputed_substitutions[payload.stage])
    logger.info("substitutions compute session=%s stage=%s", session_id, payload.stage)
    batch = run_substitutions(
        state.current_recipe,
        annotations,
        allowed_ingredients=state.allowed_ingredients,
        diet_name=state.diet_name,
        diet_instructions=state.diet_instructions,
        allow_out_of_list=state.allow_out_of_list,
    )
    return SubstitutionsResponse(batch=batch)


@router.post("/sessions/{session_id}/swaps", response_model=ApplySwapsResponse)
def apply_swaps(session_id: str, payload: ApplySwapsRequest) -> ApplySwapsResponse:
    state = store.get(session_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Session not found")

    logger.info("apply_swaps session=%s swaps=%d", session_id, len(payload.swaps))
    # Only store swaps and advance stage; rewrite is done once at finalize.
    current = state.current_recipe
    rewritten = RewrittenRecipe(
        title=current.title,
        ingredients=current.ingredients,
        instructions=current.instructions,
        change_log=[],
    )

    state.current_recipe = current
    state.swap_history.extend(payload.swaps)
    state.advance_stage()
    store.update(session_id, state)

    return ApplySwapsResponse(
        rewritten_recipe=rewritten,
        current_recipe=current,
        swap_history=state.swap_history,
    )


@router.get("/sessions/{session_id}/recipe")
def get_recipe(session_id: str) -> dict:
    state = store.get(session_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"current_recipe": state.current_recipe}


@router.post("/sessions/{session_id}/finalize", response_model=ApplySwapsResponse)
def finalize_recipe(
    session_id: str, payload: FinalizeRequest | None = None
) -> ApplySwapsResponse:
    state = store.get(session_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Session not found")

    swaps = payload.swaps if payload and payload.swaps is not None else state.swap_history
    logger.info("finalize session=%s swaps=%d", session_id, len(swaps))
    rewritten = run_rewrite(state.current_recipe, swaps=swaps)
    current = rewritten_to_parsed(rewritten)

    state.current_recipe = current
    state.swap_history = list(swaps)
    store.update(session_id, state)

    return ApplySwapsResponse(
        rewritten_recipe=rewritten,
        current_recipe=current,
        swap_history=state.swap_history,
    )


@router.get("/sessions/{session_id}/web-recipes", response_model=RecipePreviewResponse)
def get_web_recipes(session_id: str, limit: int = 5) -> RecipePreviewResponse:
    state = store.get(session_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Session not found")

    previews, failures = build_recipe_previews(
        state.current_recipe,
        state.swap_history,
        limit=limit,
    )
    return RecipePreviewResponse(items=previews, failures=failures)
