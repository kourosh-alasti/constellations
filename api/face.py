from facenet_pytorch import InceptionResnetV1
from PIL import Image
from torchvision import transforms
from typing import List

from functools import lru_cache

@lru_cache()
def get_facenet_model():
    return InceptionResnetV1(pretrained='vggface2').eval()

transform = transforms.Compose([
    transforms.Resize((160, 160)),
    transforms.ToTensor(),
    transforms.Normalize([0.5], [0.5])
])

def gen_embed(image_path: str, model) -> List[float]:
    # TODO: Probably add error handling to images
    img = Image.open(image_path)
    img_tensor = transform(img).unsqueeze(0)

    return model(img_tensor).tolist()
