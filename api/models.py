from pydantic import BaseModel
from sqlmodel import SQLModel, Field, Relationship
from pgvector.sqlalchemy import Vector
from typing import Any, List, Optional
import random

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

    # Relationships
    source_edges: List["Edge"] = Relationship(
        back_populates="source_node",
        sa_relationship_kwargs={"foreign_keys": "Edge.source"}
    )
    target_edges: List["Edge"] = Relationship(
        back_populates="target_node",
        sa_relationship_kwargs={"foreign_keys": "Edge.target"}
    )


# Edge

class Edge(SQLModel, table=True):
    source: int = Field(foreign_key="node.id", primary_key=True)
    target: int = Field(foreign_key="node.id", primary_key=True)
    value: int = Field(default=1)
    
    # Relationships
    source_node: Optional[Node] = Relationship(
        back_populates="source_edges",
        sa_relationship_kwargs={"foreign_keys": "Edge.source"}
    )
    target_node: Optional[Node] = Relationship(
        back_populates="target_edges",
        sa_relationship_kwargs={"foreign_keys": "Edge.target"}
    )


# Auth
class AuthRequest(BaseModel):
    # Temp model for simple auth
    first_name: str
    last_name: str

# API request/response models 
class GetNode(BaseModel):
    """
    Response for get_users endpoints

    a list of users in a related constellation
    """
    pass

class NodePublic(BaseModel):
    id: int
    name: str
    x: int = Field(default_factory=lambda: random.randint(500, 1000))
    y: int  = Field(default_factory=lambda: random.randint(500, 800))
    vx: int = Field(default=0)
    vy: int = Field(default=0)
    color: str = Field(default='ffffff')
    size: int = Field(default=1)