from fastapi import FastAPI, File, HTTPException
from typing import Annotated

from models import BaseNode, NodeCreate, Node
from db import Conn, create_db_and_tables

### Create FastAPI instance with custom docs and openapi url
app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get('/')
def index(): return 'go to /api/py/docs'

@app.get('/face')
def get_face(photo: Annotated[bytes, File()]):
    ... 

@app.get('/node/{user_id}', response_model=BaseNode)
def get_user(user_id: int, session: Conn):

    user = session.get(Node, user_id)
     
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    return user

@app.post('/node')
def new_user(new_node: NodeCreate, session: Conn):
    """
    creates a new user node.

    Parameters:
    first_name: first name of the new user
    last_name: last name of the new user
    image: base64 encoded image file
    """
    node_db = Node.model_validate(new_node)

    session.add(node_db)
    session.commit()
    session.refresh
    
    return node_db
