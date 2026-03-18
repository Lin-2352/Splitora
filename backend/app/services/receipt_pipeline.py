import logging
from typing import Dict, Any
from app.services.preprocessing import preprocess_image
from app.services.ocr_service import run_ocr
from app.services.extraction import extract_bill_data
from app.services.enrichment import enrich_receipt_data
from app.services.validation import validate_receipt_data
from app.services.json_formatter import format_receipt_json

logger = logging.getLogger(__name__)

def process_receipt(image_path: str, paid_by_user_id: str = "unknown_user") -> Dict[str, Any]:
    """
    Main orchestrator for the universal receipt scanner pipeline.
    
    Args:
        image_path: Path to the receipt image.
        paid_by_user_id: ID of the user submitting the receipt
        
    Returns:
        A dictionary perfectly conforming to the MongoDB JSON schema.
    """
    logger.info(f"Starting pipeline for image: {image_path}")
    
    # 1. Preprocess
    image = preprocess_image(image_path)
    
    # 2. OCR Extraction
    raw_text = run_ocr(image)
    logger.info("OCR completed successfully")
    
    # 3. Structural Extraction
    extracted_data = extract_bill_data(raw_text)
    logger.info("Data extraction completed")
    
    # 4. Validation
    validated_data = validate_receipt_data(extracted_data)
    logger.info(f"Validation completed. Confidence Score: {validated_data.get('confidence_score')}")
    
    # 5. Semantic Enrichment
    enriched_data = enrich_receipt_data(validated_data, raw_text, paid_by_user_id)
    logger.info("Semantic enrichment completed")
    
    # 6. Schema Formatting
    final_output = format_receipt_json(enriched_data, raw_text=raw_text)
    
    return final_output
