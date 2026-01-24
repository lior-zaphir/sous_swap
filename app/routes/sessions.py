from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.api import (
    ApplySwapsRequest,
    ApplySwapsResponse,
    CreateSessionRequest,
    CreateSessionResponse,
    StageResponse,
    SubstitutionsRequest,
    SubstitutionsResponse,
)
from app.services.pipeline import (
    run_annotate,
    run_parse,
    run_rewrite,
    run_substitutions,
    stage_annotations,
    rewritten_to_parsed,
)
from app.services.session_store import InMemorySessionStore, SessionState


router = APIRouter(tags=["sessions"])
store = InMemorySessionStore()


@router.post("/sessions", response_model=CreateSessionResponse)
def create_session(payload: CreateSessionRequest) -> CreateSessionResponse:
    parsed = run_parse(payload.recipe_text)
    annotated = run_annotate(parsed)
    state = SessionState(
        parsed_recipe=parsed,
        annotated_recipe=annotated,
        current_recipe=parsed,
        allowed_ingredients=payload.allowed_ingredients,
        goal=payload.goal,
        diet_name=payload.diet_profile.name if payload.diet_profile else None,
        diet_instructions=payload.diet_profile.instructions if payload.diet_profile else None,
        allow_out_of_list=payload.allow_out_of_list,
    )
    session_id = store.create(state)
    return CreateSessionResponse(
        session_id=session_id,
        parsed_recipe=parsed,
        annotated_recipe=annotated,
        stage_order=state.stage_order,
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
    batch = run_substitutions(
        state.current_recipe,
        annotations,
        allowed_ingredients=state.allowed_ingredients,
        goal=state.goal,
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

    rewritten = run_rewrite(state.current_recipe, payload.swaps)
    current = rewritten_to_parsed(rewritten)

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
