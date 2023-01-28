from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse

from storyweb.db import Conn
from storyweb.ontology import OntologyModel, ontology
from storyweb.logic.graph import generate_graph_gexf, generate_graph_ftm
from storyweb.routes.util import get_conn

router = APIRouter()


@router.get("/ontology", response_model=OntologyModel)
def ontology_model() -> OntologyModel:
    return ontology.model


@router.get("/gexf", response_class=PlainTextResponse)
def all_gexf(
    conn: Conn = Depends(get_conn),
):
    text = generate_graph_gexf(conn)
    return PlainTextResponse(
        content=text,
        media_type="text/xml",
        headers={"Content-Disposition": f"attachment; filename=storyweb.gexf"},
    )


@router.get("/ftm", response_class=PlainTextResponse)
def all_ftm(conn: Conn = Depends(get_conn)):
    text = generate_graph_ftm(conn)
    return PlainTextResponse(
        content=text,
        media_type="application/json+ftm",
        headers={"Content-Disposition": f"attachment; filename=storyweb.ftm.json"},
    )
