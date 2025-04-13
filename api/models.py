from pydantic import BaseModel
from sqlmodel import SQLModel, Field
from pgvector.sqlalchemy import Vector
from typing import Any

# Node
class BaseNode(SQLModel):
    first_name: str
    last_name: str
    image: str # This is a base64 encoded jpg image
    color: str = Field(default='#ffffff')

    class Config:
        arbitrary_types_allowed = True

class NodeCreate(BaseNode):
    pass

class Node(BaseNode, table=True):
    id: int | None = Field(default=None, primary_key=True)
    # embed: Any = Field(default=None, sa_type=Vector(1))

# Edge
# TODO: Fill in relationship deps

# class BaseEdge(SQLModel):
#     user_1: int = Field(foreign_key=True)
#     user_2: int = Field(foreign_key=True)
#
# class Edge(BaseEdge, table=True):
#     pass

# api request/response models 
class GetNode(BaseModel):
    """
    Response for get_users endpoints

    a list of users in a related constellation
    """
