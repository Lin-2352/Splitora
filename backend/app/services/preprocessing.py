import cv2
import numpy as np
import os

def preprocess_image(image_path: str) -> np.ndarray:
    """Minimal preprocessing: Read and upscale 2.5x."""
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at path: {image_path}")
        
    image = cv2.imread(str(image_path))
    if image is None:
        raise ValueError(f"Failed to load image at path: {image_path}")

    # Upscale heavily improves Tesseract accuracy for small receipt text
    image = cv2.resize(image, None, fx=2.5, fy=2.5, interpolation=cv2.INTER_CUBIC)
    
    return image