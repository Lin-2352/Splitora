import pytesseract
import cv2
import numpy as np
import re
import logging

logger = logging.getLogger(__name__)

# Tesseract configuration for receipt scanning
# --oem 3: Default OCR Engine Mode
# --psm 6: Assume a single uniform block of text (works well for structured receipts)
# preserve_interword_spaces=1: Prevent Tesseract from collapsing wide visual gaps between item names and prices
OCR_CONFIG = "--oem 3 --psm 6 -c preserve_interword_spaces=1"

# Automatically find Tesseract for Windows users 
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def normalize_text(text: str) -> str:
    """Normalize OCR text while preserving newlines."""
    # Replace comma decimals with dot decimals
    text = text.replace(',', '.')
    
    lines = text.split('\n')
    normalized_lines = []
    
    for line in lines:
        # Collapse multiple spaces into single spaces per-line (preserves horizontal meaning without breaking regex)
        # Using a specialized replacement so we don't accidentally squash valid tab stops if required,
        # but the prompt requested: "Collapse multiple spaces using regex" and "Collapse spaces per-line"
        line = re.sub(r' {2,}', ' ', line)
        normalized_lines.append(line.strip())
        
    return '\n'.join(normalized_lines)

def split_lines(text: str) -> list[str]:
    """Split text into stripped, non-empty lines."""
    lines = text.split('\n')
    return [line.strip() for line in lines if line.strip()]

def run_ocr(image: np.ndarray) -> str:
    """Run Tesseract OCR on a preprocessed image."""
    logger.info("Starting OCR processing")
    raw_text = pytesseract.image_to_string(image, config=OCR_CONFIG)
    logger.info("OCR completed successfully")
    
    return normalize_text(raw_text)
