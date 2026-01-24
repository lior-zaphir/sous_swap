from __future__ import annotations

from fastapi import FastAPI

from app.routes.sessions import router as sessions_router


app = FastAPI(title="SousSwap API", version="0.1.0")

app.include_router(sessions_router, prefix="/v1")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
