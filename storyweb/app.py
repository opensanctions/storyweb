from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException
from starlette.responses import Response
from starlette.types import Scope

from storyweb.routes import links, stories, articles, clusters, system


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
app.include_router(system.router, prefix="/api/1")
app.include_router(links.router, prefix="/api/1")
app.include_router(stories.router, prefix="/api/1")
app.include_router(articles.router, prefix="/api/1")
app.include_router(clusters.router, prefix="/api/1")


class SPAStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope: Scope) -> Response:
        try:
            return await super().get_response(path, scope)
        except HTTPException as http:
            if http.status_code == 404 and not path.startswith("api"):
                return await super().get_response("index.html", scope)
            else:
                raise


app.mount("/", SPAStaticFiles(directory="frontend/build", html=True), name="frontend")
