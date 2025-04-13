from fastapi import APIRouter, File, HTTPException
from typing import Annotated
from io import BytesIO
from PIL import Image
import base64
from pydantic import BaseModel, Field
from sqlmodel import select
from uuid import uuid4

# from ..face import gen_embed
from ..face import get_facenet_model, gen_embed
from ..models import BaseNode, NodeCreate, Node, Edge, NodePublic
from ..db import Conn 


router = APIRouter(prefix="/api/py")

class FaceRequest(BaseModel):
    image: str # This is a base64 encoded jpg image


@router.post('/match-face/{user_id}')
def match_face(face: FaceRequest, session: Conn):
    """
    Match a face against the database and return the closest matches
    
    Parameters:
    face: Face image to match (base64 encoded)
    """
    try:
        # Process image
        if face.image.startswith('data:image'):
            image_data = face.image.split(',', 1)[1]
        else:
            image_data = face.image

<<<<<<< Updated upstream
    filename = str(uuid4())
=======
        # Generate a safer filename
        import uuid
        filename = str(uuid.uuid4())
>>>>>>> Stashed changes

        # Save and process image
        image_decoded = base64.b64decode(image_data)
        saved_file = f'uploads/temp/{filename}.jpg'

        # Ensure directory exists
        import os
        os.makedirs('uploads/temp', exist_ok=True)

        image_file = BytesIO(image_decoded)
        image_file = Image.open(image_file)
        image_file.save(saved_file)
        image_file.close()

<<<<<<< Updated upstream
    closest = session.exec(select(Node).order_by(Node.embed.l2_distance(embed)).limit(10)) 

    if not closest:
        raise HTTPException(status_code=400, detail='Failed to fetch closest faces')

    candidates = closest.all()

    return [{
        'id': candidate.id,
        'name': f"{candidate.first_name} {candidate.last_name}",
        'image': candidate.image,
        'distance': candidate.embed.l2_distance(embed)
    } for candidate in candidates]
=======
        # Generate embedding
        embed = gen_embed(saved_file, get_facenet_model())[0]

        # Use direct SQL with pgvector's distance function
        from sqlalchemy import text, func
        from sqlalchemy.sql import select as sa_select
        
        # Method 1: Using SQLModel with direct distance calculation
        stmt = select(
            Node.id, 
            Node.first_name, 
            Node.last_name, 
            Node.image,
            Node.color,
            Node.embed.l2_distance(embed).label("distance")
        ).order_by(
            Node.embed.l2_distance(embed)
        ).limit(5)
        
        result = session.exec(stmt)
        matches = result.all()
        
        if not matches:
            raise HTTPException(status_code=404, detail='No matches found')
            
        # Convert to a list of dictionaries with distance scores
        response = []
        for match in matches:
            response.append({
                "id": match.id,
                "first_name": match.first_name,
                "last_name": match.last_name,
                "similarity_score": 1.0 / (1.0 + float(match.distance)),  # Convert distance to similarity (0-1)
                "distance": float(match.distance)  # Original L2 distance
            })
            
        return response
        
    except Exception as e:
        print(f"Error in match_face: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error matching face: {str(e)}")
>>>>>>> Stashed changes


@router.get('/node/{user_id}', response_model=BaseNode)
def get_user(user_id: int, session: Conn):

    user = session.get(Node, user_id)
     
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
   
    node = user.dict()
    
    new_node = BaseNode(**node)
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
