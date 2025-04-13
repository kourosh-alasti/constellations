from fastapi import APIRouter, File, HTTPException
from typing import Annotated
from io import BytesIO
from PIL import Image
import base64
import random
from pydantic import BaseModel, Field

# from ..face import gen_embed
from ..face import get_facenet_model, gen_embed
from ..models import BaseNode, NodeCreate, Node, Edge, NodePublic
from ..db import Conn 




router = APIRouter(prefix="/api/py")


@router.get('/node/{user_id}', response_model=NodePublic)
def get_user(user_id: int, session: Conn):

    user = session.get(Node, user_id)
     
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
   
    node = user.dict()
    node['name'] = user.first_name 
    
    new_node = NodePublic(**node)
    return new_node


@router.post('/node/{user_id}')
def new_user(user_id: int, new_node: NodeCreate, session: Conn):
    """
    creates a new user node.

    Parameters:
    user_id: id of the current user
    first_name: first name of the new user
    last_name: last name of the new user
    image: base64 encoded jpg image
    """
   
    if new_node.image.startswith('data:image'):
        image_data = new_node.image.split(',', 1)[1]
    else:
        image_data = new_node.image

    new_node.image = image_data
    image_decoded = base64.b64decode(image_data)

    saved_file = f'uploads/{new_node.first_name}_{new_node.last_name}.jpg'

    image_file = BytesIO(image_decoded)
    image_file = Image.open(image_file)
    image_file.save(saved_file)
    image_file.close()

    embed = gen_embed(saved_file, get_facenet_model())[0]

    node_data = new_node.dict()
    node_data['embed'] = embed
    node_db = Node(**node_data)


    session.add(node_db)
    session.commit()
    session.refresh(node_db)
    
    edge1 = Edge(source=user_id, target=node_db.id)
    session.add(edge1)
    session.commit()
    session.refresh(edge1)
   
    edge2 = Edge(source=node_db.id, target=user_id)
    session.add(edge2)
    session.commit()
    session.refresh(edge2)
    
    return node_db
