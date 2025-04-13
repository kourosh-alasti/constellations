from fastapi import APIRouter, HTTPException
from typing import List
from sqlmodel import select
from pydantic import BaseModel

from ..models import Edge, Node, NodePublic
from ..db import Conn

router = APIRouter(prefix="/api/py")

class GraphResponse(BaseModel):
    nodes: List[NodePublic]
    edges: List[Edge]

@router.get('/graph/{user_id}', response_model=GraphResponse)
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

    # Get all nodes connected to the user through edges (only checking source->target direction)
    nodes = session.exec(
        select(Node).where(
            (Node.id == user_id) |
            (Node.id.in_(
                select(Edge.target).where(Edge.source == user_id)
            ))
        )
    ).all()

    # Get all edges where user is the source (since we store both directions)
    edges = session.exec(
        select(Edge).where(Edge.source == user_id)
    ).all()

    # Convert nodes to NodePublic
    public_nodes = [NodePublic(
        id=node.id,
        name=f"{node.first_name} {node.last_name}",
        color=node.color
    ) for node in nodes]

    return GraphResponse(nodes=public_nodes, edges=edges)

