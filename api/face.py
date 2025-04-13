from facenet_pytorch import InceptionResnetV1, MTCNN
from PIL import Image
from torchvision import transforms
from typing import List, Optional
import torch
from functools import lru_cache
import os

# Create uploads/processed directory if it doesn't exist
os.makedirs('uploads/processed', exist_ok=True)

# Initialize face detection once
face_detector = MTCNN(
    image_size=160,  # FaceNet expects 160x160
    margin=10,       # Add small margin
    post_process=True,
    device='cpu'     # Change to 'cuda' if you have GPU
)

@lru_cache()
def get_facenet_model():
    # The 'vggface2' model is trained on a smaller dataset
    # The 'casia-webface' model is trained on a larger dataset and may provide better accuracy
    # Both models output 512-dimensional embeddings, so no other code changes needed
    return InceptionResnetV1(pretrained='casia-webface').eval()  # Alternative: 'vggface2'

# Only needed if MTCNN is not used (fallback transform)
fallback_transform = transforms.Compose([
    transforms.Resize((160, 160)),
    transforms.ToTensor(),
    transforms.Normalize([0.5], [0.5])
])

def detect_and_align_face(image_path: str) -> Optional[torch.Tensor]:
    """
    Detect and align a face in an image.
    Returns an aligned face tensor or None if no face is found.
    """
    try:
        # Load image
        img = Image.open(image_path).convert('RGB')
        
        # Detect and align face
        face_tensor = face_detector(img)
        
        # Save processed face for inspection (optional)
        if face_tensor is not None:
            processed_path = image_path.replace('.jpg', '_processed.jpg')
            processed_path = processed_path.replace('uploads/', 'uploads/processed/')
            processed_img = transforms.ToPILImage()(face_tensor)
            processed_img.save(processed_path)
            
        return face_tensor
    except Exception as e:
        print(f"Error in face detection: {str(e)}")
        return None

def gen_embed(image_path: str, model) -> List[float]:
    """
    Generate embedding for a face image.
    If face detection succeeds, uses the aligned face.
    If face detection fails, falls back to the original approach.
    """
    # Try to detect and align face
    face_tensor = detect_and_align_face(image_path)
    
    if face_tensor is not None:
        # Face detected - use the aligned face
        face_tensor = face_tensor.unsqueeze(0)  # Add batch dimension
        return model(face_tensor).tolist()[0]
    else:
        # No face detected - fall back to original method
        print(f"No face detected in {image_path}, using fallback method")
        img = Image.open(image_path)
        img_tensor = fallback_transform(img).unsqueeze(0)
        return model(img_tensor).tolist()[0]

# Helper function to compare two faces (optional)
def compare_faces(img_path1: str, img_path2: str) -> float:
    """
    Compare two faces and return similarity score (lower is more similar).
    """
    model = get_facenet_model()
    embed1 = gen_embed(img_path1, model)
    embed2 = gen_embed(img_path2, model)
    
    # Convert to tensors
    tensor1 = torch.tensor(embed1)
    tensor2 = torch.tensor(embed2)
    
    # Calculate L2 distance
    distance = torch.dist(tensor1, tensor2).item()
    return distance


# from facenet_pytorch import InceptionResnetV1
# from PIL import Image
# from torchvision import transforms
# from typing import List

# from functools import lru_cache

# @lru_cache()
# def get_facenet_model():
#     return InceptionResnetV1(pretrained='vggface2').eval()

# transform = transforms.Compose([
#     transforms.Resize((160, 160)),
#     transforms.ToTensor(),
#     transforms.Normalize([0.5], [0.5])
# ])

# def gen_embed(image_path: str, model) -> List[float]:
#     # TODO: Probably add error handling to images
#     img = Image.open(image_path)
#     img_tensor = transform(img).unsqueeze(0)

#     return model(img_tensor).tolist()[0]
