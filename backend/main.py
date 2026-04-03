import os
from contextlib import asynccontextmanager
from pathlib import Path

# Load .env from project root (parent of backend/) before any other imports
# so env vars are available when modules like auth_service initialize.
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from database import init_db
from routers import pdf
from routers import auth as auth_router
from routers import chat as chat_router

STATIC_DIR = Path(__file__).parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Prelegal API", lifespan=lifespan)

# CORS — only needed in local dev (frontend runs on a different port).
# In Docker, FastAPI serves the frontend directly (same origin).
_cors_origins = os.environ.get("CORS_ORIGINS", "")
if _cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in _cors_origins.split(",")],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(pdf.router, prefix="/api")
app.include_router(auth_router.router, prefix="/api/auth")
app.include_router(chat_router.router, prefix="/api")


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


# Serve Next.js static export — only present inside Docker
if STATIC_DIR.exists():
    # Serve /_next/static assets efficiently
    next_assets = STATIC_DIR / "_next"
    if next_assets.exists():
        app.mount("/_next", StaticFiles(directory=next_assets), name="next_assets")

    _static_root = STATIC_DIR.resolve()
    _index_html = STATIC_DIR / "index.html"

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(request: Request, full_path: str) -> FileResponse:
        def _safe(path: Path) -> Path | None:
            """Return the path only if it is inside STATIC_DIR and is a file."""
            resolved = path.resolve()
            if str(resolved).startswith(str(_static_root)) and resolved.is_file():
                return resolved
            return None

        # Exact file match (e.g. favicon.ico, images)
        if hit := _safe(STATIC_DIR / full_path):
            return FileResponse(hit)
        # Next.js static export produces login.html, signup.html at root level
        if hit := _safe(STATIC_DIR / f"{full_path}.html"):
            return FileResponse(hit)
        # SPA fallback — serve index.html for unknown paths
        if not _index_html.is_file():
            raise HTTPException(status_code=503, detail="Frontend not built")
        return FileResponse(_index_html)
