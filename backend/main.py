from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import pdf

app = FastAPI(title="Prelegal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(pdf.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}
