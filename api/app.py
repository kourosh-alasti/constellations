from fastapi import FastAPI, File, Depends
from typing import Annotated
from sqlmodel import Session

from models import BaseNode, BaseEdge, NodeCreate
from db import Conn


### Create FastAPI instance with custom docs and openapi url
app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")


@app.get('/face')
def get_face(photo: Annotated[bytes, File()]):
    ... 

@app.get('/Node', response_model=BaseNode)
def get_user(id: int):
    ...


@app.post('/Node')
def new_user(new_node: NodeCreate, session: Conn):
    """
    creates a new user node.

    Parameters:
    first_name: first name of the new user
    last_name: last name of the new user
    image: base64 encoded image file
    """
    session.add(new_node)
    session.commit()
    session.refresh
    
    return new_node
