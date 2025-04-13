from pydantic import BaseModel
from sqlmodel import SQLModel, Field, Relationship
from pgvector.sqlalchemy import Vector
from typing import Any, List

# Node
class BaseNode(SQLModel):
    first_name: str
    last_name: str
    image: str # This is a base64 encoded jpg image
    color: str = Field(default='#ffffff')

    class Config:
        arbitrary_types_allowed = True

class NodeCreate(BaseNode):
    ...

class Node(BaseNode, table=True):
    id: int | None = Field(default=None, primary_key=True)
    embed: Any = Field(default=None, sa_type=Vector(512))

    # relationship to edges
    edges: List[Edge] = Relationship(back_populates='source_node')


# Edge

class Edge(SQLModel, table=True):
    source: int = Field(foreign_key=True, primary_key=True)
    target: int = Field(foreign_key=True, primary_key=True)
    value: int = Field(default=1)
    
    # relationship to source node
    source_node: Node = Relationship(back_populates='edges')

    # relationship to target node
    target_node: Node = Relationship(back_populates='edges')


# Auth
class AuthRequest(BaseModel):
    # Temp model for simple auth
    first_name: str
    last_name: str