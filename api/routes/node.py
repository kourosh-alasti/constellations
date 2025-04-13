from fastapi import APIRouter, File, HTTPException
from typing import Annotated
from io import BytesIO
from PIL import Image
import base64

# from ..face import gen_embed
from ..face import get_facenet_model, gen_embed
from ..models import BaseNode, NodeCreate, Node
from ..db import Conn 

router = APIRouter(prefix="/api/py")

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
    print(embed)

    node_data = new_node.dict()
    node_data['embed'] = embed
    node_db = Node(**node_data)

    session.add(node_db)
    session.commit()
    session.refresh
    
    return node_db
