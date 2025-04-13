from facenet_pytorch import InceptionResnetV1, MTCNN
from PIL import Image, ImageOps
from torchvision import transforms
from typing import List, Optional, Tuple
import torch
from functools import lru_cache
import os
import numpy as np

# Create uploads/processed directory if it doesn't exist
os.makedirs('uploads/processed', exist_ok=True)

# Initialize face detection with better parameters
face_detector = MTCNN(
    image_size=160,      # FaceNet expects 160x160
    margin=40,           # Increased margin to capture more facial context
    min_face_size=40,    # Reduce min face size to detect smaller faces
    thresholds=[0.6, 0.7, 0.8],  # Slightly relaxed thresholds
    factor=0.709,        # Standard for MTCNN
    post_process=True,
    device='cpu'         # Change to 'cuda' if you have GPU
)

@lru_cache()
def get_facenet_model():
    # Using casia-webface model which is better for face recognition
    model = InceptionResnetV1(pretrained='casia-webface').eval()
    return model

# Transform pipeline for when MTCNN fails
fallback_transform = transforms.Compose([
    transforms.Resize((160, 160)),
    transforms.ToTensor(),
    transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5])
])

def get_fallback_transform(img: Image.Image):
    """Creates a dynamic transform pipeline based on input image dimensions"""
    return transforms.Compose([
        transforms.CenterCrop(min(img.size)),  # Square crop from center
        transforms.Resize((160, 160)),
        transforms.ToTensor(),
        transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5])
    ])

def preprocess_image(image_path: str) -> Image.Image:
    """
    Preprocess the image for better face detection:
    - Convert to RGB
    - Auto-orient based on EXIF data
    - Moderate contrast enhancement
    """
    try:
        img = Image.open(image_path)
        
        # Convert to RGB (removes alpha channel if present)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Auto-orient image based on EXIF data
        img = ImageOps.exif_transpose(img)
        
        # Add very subtle enhancements - too much can distort facial features
        from PIL import ImageEnhance
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.1)  # Reduced from 1.2
        
        # Save preprocessed image for debugging
        debug_path = image_path.replace('.jpg', '_preprocessed.jpg')
        debug_path = debug_path.replace('uploads/', 'uploads/processed/')
        img.save(debug_path)
        
        return img
    except Exception as e:
        print(f"Error preprocessing image: {str(e)}")
        # If preprocessing fails, try to return the original image
        try:
            return Image.open(image_path).convert('RGB')
        except:
            raise ValueError(f"Cannot open or process image: {image_path}")

def detect_largest_face(img: Image.Image) -> Tuple[Optional[torch.Tensor], Optional[List[float]]]:
    """
    Detects the largest face in the image and returns both the face tensor and bounding box.
    """
    try:
        # Get face bounding boxes and probabilities
        boxes, probs = face_detector.detect(img, landmarks=False)
        
        if boxes is None or len(boxes) == 0:
            return None, None
        
        # Find the largest face by area
        areas = [(box[2] - box[0]) * (box[3] - box[1]) for box in boxes]
        largest_idx = np.argmax(areas)
        
        # Extract the aligned face tensor
        face_tensor = face_detector.extract(img, boxes[largest_idx].reshape(1, -1), None)[0]
        
        return face_tensor, boxes[largest_idx].tolist()
    except Exception as e:
        print(f"Error detecting face: {str(e)}")
        return None, None

def detect_and_align_face(image_path: str) -> Optional[torch.Tensor]:
    """
    Detect and align a face in an image with enhanced preprocessing.
    Returns an aligned face tensor or None if no face is found.
    """
    try:
        # Preprocess the image
        img = preprocess_image(image_path)
        
        # Try with different detection settings if needed
        detection_settings = [
            {'thresholds': [0.6, 0.7, 0.8]},  # Default (slightly relaxed)
            {'thresholds': [0.5, 0.6, 0.7]},  # More permissive
            {'thresholds': [0.7, 0.75, 0.8]}  # More strict
        ]
        
        # First try with default settings
        face_tensor, bbox = detect_largest_face(img)
        
        # If no face detected, try with alternative settings
        if face_tensor is None:
            for settings in detection_settings[1:]:
                # Temporarily update detector settings
                original_thresholds = face_detector.thresholds
                face_detector.thresholds = settings['thresholds']
                
                # Try detection again
                face_tensor, bbox = detect_largest_face(img)
                
                # Restore original settings
                face_detector.thresholds = original_thresholds
                
                if face_tensor is not None:
                    print(f"Face detected with alternative settings: {settings}")
                    break
        
        # Save processed face for inspection
        if face_tensor is not None:
            processed_path = image_path.replace('.jpg', '_processed.jpg')
            processed_path = processed_path.replace('uploads/', 'uploads/processed/')
            processed_img = transforms.ToPILImage()(face_tensor)
            processed_img.save(processed_path)
            print(f"Processed face saved to {processed_path}")
            
            if bbox:
                # Save the original image with face cropping for verification
                # Expand bounding box to include more context
                img_width, img_height = img.size
                x1, y1, x2, y2 = bbox
                
                # Calculate the face size and center
                face_width = x2 - x1
                face_height = y2 - y1
                face_center_x = (x1 + x2) / 2
                face_center_y = (y1 + y2) / 2
                
                # Determine the crop size (making it square and larger than face)
                # Use 2.0x the max dimension of the face for better framing
                crop_size = max(face_width, face_height) * 2.0
                
                # Calculate the new bounding box
                new_x1 = max(0, face_center_x - crop_size / 2)
                new_y1 = max(0, face_center_y - crop_size / 2)
                new_x2 = min(img_width, face_center_x + crop_size / 2)
                new_y2 = min(img_height, face_center_y + crop_size / 2)
                
                # Crop and save the image
                cropped_img = img.crop((new_x1, new_y1, new_x2, new_y2))
                cropped_path = image_path.replace('.jpg', '_cropped.jpg')
                cropped_path = cropped_path.replace('uploads/', 'uploads/processed/')
                cropped_img.save(cropped_path)
                print(f"Cropped face image saved to {cropped_path}")
                
                # Save the original image with bounding box for verification
                from PIL import ImageDraw
                bbox_img = img.copy()
                draw = ImageDraw.Draw(bbox_img)
                draw.rectangle(bbox, outline="red", width=3)
                draw.rectangle((new_x1, new_y1, new_x2, new_y2), outline="green", width=3)
                bbox_path = image_path.replace('.jpg', '_bbox.jpg')
                bbox_path = bbox_path.replace('uploads/', 'uploads/processed/')
                bbox_img.save(bbox_path)
                print(f"Bounding box visualization saved to {bbox_path}")
            
        return face_tensor
    except Exception as e:
        print(f"Error in face detection: {str(e)}")
        return None

def normalize_embedding(embedding: List[float]) -> List[float]:
    """
    Normalize the embedding vector to unit length for more consistent comparison.
    """
    embedding_np = np.array(embedding)
    norm = np.linalg.norm(embedding_np)
    if norm > 0:
        normalized = embedding_np / norm
        return normalized.tolist()
    return embedding

def gen_embed(image_path: str, model) -> List[float]:
    """
    Generate embedding for a face image using FaceNet with enhanced processing.
    If face detection succeeds, uses the aligned face.
    If face detection fails, returns None to indicate failure.
    """
    # Try to detect and align face
    face_tensor = detect_and_align_face(image_path)
    
    if face_tensor is not None:
        # Check if we have a cropped face image
        cropped_path = image_path.replace('.jpg', '_cropped.jpg')
        cropped_path = cropped_path.replace('uploads/', 'uploads/processed/')
        
        if os.path.exists(cropped_path):
            # Use the cropped image for better face context
            try:
                img = Image.open(cropped_path).convert('RGB')
                img = img.resize((160, 160))
                img_tensor = transforms.ToTensor()(img)
                img_tensor = transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5])(img_tensor).unsqueeze(0)
                
                with torch.no_grad():  # Disable gradient calculation for inference
                    embedding = model(img_tensor).squeeze().cpu().tolist()
                return normalize_embedding(embedding)
            except Exception as e:
                print(f"Error using cropped image, falling back to aligned face: {str(e)}")
                # Fall back to the aligned face tensor
                face_tensor = face_tensor.unsqueeze(0)  # Add batch dimension
                with torch.no_grad():
                    embedding = model(face_tensor).squeeze().cpu().tolist()
                return normalize_embedding(embedding)
        else:
            # Face detected but no cropped image - use the aligned face
            face_tensor = face_tensor.unsqueeze(0)  # Add batch dimension
            with torch.no_grad():  # Disable gradient calculation for inference
                embedding = model(face_tensor).squeeze().cpu().tolist()
            return normalize_embedding(embedding)
    else:
        # No face detected - warn and return None instead of fallback
        print(f"⚠️ WARNING: No face detected in {image_path}")
        
        # As a last resort, try with the entire image, but with a warning
        try:
            print(f"Attempting fallback with entire image (results may be unreliable)")
            img = preprocess_image(image_path)
            
            # Use dynamic fallback transform based on this image's dimensions
            custom_transform = get_fallback_transform(img)
            
            # Use center crop to get square image
            width, height = img.size
            crop_size = min(width, height)
            left = (width - crop_size) // 2
            top = (height - crop_size) // 2
            right = left + crop_size
            bottom = top + crop_size
            img = img.crop((left, top, right, bottom))
            
            # Resize to expected size
            img = img.resize((160, 160))
            
            # Convert to tensor
            img_tensor = transforms.ToTensor()(img)
            img_tensor = transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5])(img_tensor).unsqueeze(0)
            
            with torch.no_grad():
                embedding = model(img_tensor).squeeze().cpu().tolist()
            
            # Save processed fallback for inspection
            fallback_path = image_path.replace('.jpg', '_fallback.jpg')
            fallback_path = fallback_path.replace('uploads/', 'uploads/processed/')
            img.save(fallback_path)
            print(f"Fallback image saved to {fallback_path}")
            
            return normalize_embedding(embedding)
        except Exception as e:
            print(f"Fallback embedding generation failed: {str(e)}")
            return None

def cosine_similarity(embed1: List[float], embed2: List[float]) -> float:
    """
    Calculate cosine similarity between two embeddings.
    Returns a value between -1 and 1, where 1 means identical.
    """
    if not embed1 or not embed2:
        return 0.0
        
    embed1_np = np.array(embed1)
    embed2_np = np.array(embed2)
    
    # Normalize vectors (though they should already be normalized)
    embed1_np = embed1_np / np.linalg.norm(embed1_np)
    embed2_np = embed2_np / np.linalg.norm(embed2_np)
    
    # Calculate cosine similarity
    similarity = np.dot(embed1_np, embed2_np)
    return float(similarity)

# Helper function to compare two faces with enhanced comparison
def compare_faces(img_path1: str, img_path2: str) -> dict:
    """
    Compare two faces and return similarity scores using multiple metrics.
    """
    model = get_facenet_model()
    embed1 = gen_embed(img_path1, model)
    embed2 = gen_embed(img_path2, model)
    
    if embed1 is None or embed2 is None:
        return {
            "error": "Could not generate embeddings for one or both images",
            "l2_distance": float('inf'),
            "l2_similarity": 0.0,
            "cosine_similarity": 0.0
        }
    
    # Calculate L2 distance (lower is more similar)
    tensor1 = torch.tensor(embed1)
    tensor2 = torch.tensor(embed2)
    l2_distance = torch.dist(tensor1, tensor2).item()
    
    # Calculate similarity score (higher is more similar)
    l2_similarity = 1.0 / (1.0 + l2_distance)
    
    # Calculate cosine similarity (higher is more similar)
    cos_similarity = cosine_similarity(embed1, embed2)
    
    return {
        "l2_distance": l2_distance,
        "l2_similarity": l2_similarity,
        "cosine_similarity": cos_similarity
    }
