from fastapi import APIRouter, File, HTTPException
from typing import Annotated
from io import BytesIO
from PIL import Image
import base64

from ..models import BaseNode, NodeCreate, Node
from ..db import Conn 

router = APIRouter()

@router.get('/face')
def get_face(photo: Annotated[bytes, File()]):
    ... 

@router.get('/node/{user_id}', response_model=BaseNode)
def get_user(user_id: int, session: Conn):

    user = session.get(Node, user_id)
     
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    return user

@router.post('/node')
def new_user(new_node: NodeCreate, session: Conn):
    """
    creates a new user node.

    Parameters:
    first_name: first name of the new user
    last_name: last name of the new user
    image: base64 encoded jpg image
    """

    image = new_node.image
    image_decoded = base64.b64decode(image)

    image_file = BytesIO(image_decoded)
    image_file = Image.open(image_file)
    image_file.save(f'{new_node.first_name}_{new_node.last_name}.jpg')
    image_file.close()

    node_db = Node.model_validate(new_node)

    session.add(node_db)
    session.commit()
    session.refresh
    
    return node_db
