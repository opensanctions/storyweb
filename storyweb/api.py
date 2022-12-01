from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from storyweb.ontology import OntologyModel, ontology
from storyweb.routes import links, stories, articles, clusters


app = FastAPI(
    title="storyweb",
    description="make networks from text",
    redoc_url="/",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(links.router)
app.include_router(stories.router)
app.include_router(articles.router)
app.include_router(clusters.router)


@app.get("/ontology", response_model=OntologyModel)
def ontology_model() -> OntologyModel:
    return ontology.model
