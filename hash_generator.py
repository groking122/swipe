from PIL import Image
import imagehash
import requests
from io import BytesIO

def generate_phash(image_url: str) -> str:
    """Generate perceptual hash for an image"""
    response = requests.get(image_url)
    img = Image.open(BytesIO(response.content))
    return str(imagehash.average_hash(img))