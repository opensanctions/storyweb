from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from storyweb.ontology import OntologyModel, ontology
from storyweb.routes import links, stories, articles, clusters


app = FastAPI(
    title="storyweb",
    description="make networks from text",
    redoc_url="/api/1/docs",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(links.router, prefix="/api/1")
app.include_router(stories.router, prefix="/api/1")
app.include_router(articles.router, prefix="/api/1")
app.include_router(clusters.router, prefix="/api/1")


@app.get("/api/1/ontology", response_model=OntologyModel)
def ontology_model() -> OntologyModel:
    return ontology.model


app.mount("/", StaticFiles(directory="frontend/build", html=True), name="frontend")
