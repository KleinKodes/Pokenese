from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import auth, challenge, daily, glossary, user

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup: pre-load Pokemon data into memory cache
    try:
        from app.pokemon_data import load_pokemon_data, get_all_pokemon_ids
        data = load_pokemon_data()
        ids = get_all_pokemon_ids()
        print(f"[startup] Loaded {len(data)} Pokemon ({len(ids)} unique IDs)")
    except Exception as e:
        print(f"[startup] Warning: Could not load Pokemon data: {e}")

    yield

    # Shutdown cleanup (if needed)


app = FastAPI(
    title="Pokenese API",
    description="Backend for Pokenese — a Mandarin Chinese learning game using Pokémon names",
    version="1.0.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler for unhandled errors
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    if settings.is_production:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"},
        )
    # In development, expose the error message
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc), "type": type(exc).__name__},
    )


# Register routers
app.include_router(auth.router)
app.include_router(daily.router)
app.include_router(challenge.router)
app.include_router(glossary.router)
app.include_router(user.router)


@app.get("/health", tags=["health"])
async def health_check() -> dict:
    return {"status": "ok", "service": "pokenese-backend"}


@app.get("/", tags=["health"])
async def root() -> dict:
    return {"message": "Pokenese API", "docs": "/docs"}
