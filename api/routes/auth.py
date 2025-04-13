from fastapi import APIRouter, HTTPException
from sqlmodel import select
from PIL import Image
from io import BytesIO
import base64

from ..db import Conn
from ..models import Node, AuthRequest, NodeCreate
from ..face import gen_embed, get_facenet_model

router = APIRouter(
    prefix='/api/py'
)


@router.post('/auth')
def auth(auth_request: AuthRequest, session: Conn):
    """
    Authenticate a user
    """
    user = session.exec(select(Node).where(Node.first_name == auth_request.first_name, 
                                           Node.last_name == auth_request.last_name)).first()
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    
    return user.id

@router.post('/auth/new')
def new_user(new_node: NodeCreate, session: Conn):
    """
    Create a new user without a connection to the graph
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

    embed = gen_embed(saved_file, get_facenet_model())

    node_data = new_node.dict()
    node_data['embed'] = embed
    node_db = Node(**node_data)


    session.add(node_db)
    session.commit()
    session.refresh(node_db)
    
    return node_db.id
