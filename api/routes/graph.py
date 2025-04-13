from fastapi import APIRouter, HTTPException
from typing import List
from sqlmodel import select

from ..models import EdgePublic, NodePublic, Node, Edge
from ..db import Conn

router = APIRouter(prefix="/api/py")


@router.get('/graph/{user_id}', response_model=List[NodePublic])
def get_graph(user_id: int, session: Conn):
    """
    Get the graph for a user
    returns a list of nodes and edges
    nodes are the users in the graph
    edges are the edges between the nodes

    Parameters:
    user_id: id of the user
    """

    user = session.get(Node, user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    nodes = session.exec(select(Node).where(Node.id == user_id)).all()
    edges = session.exec(select(Edge).where(Edge.source_node == user_id)).all()

    return nodes, edges

