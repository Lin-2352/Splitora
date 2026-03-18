import os
import uuid
import time
import json
import logging
import asyncio
from typing import List, Optional
from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from app.services.receipt_pipeline import process_receipt

router = APIRouter()
logger = logging.getLogger(__name__)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")
ALLOWED_MIME_TYPES = ("image/jpeg", "image/png", "image/webp")
PROCESS_TIMEOUT_SECONDS = 15  # 15 seconds mostly for OCR safety

class Item(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None

class Tax(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = None

class ReceiptResponse(BaseModel):
    vendor: Optional[str] = None
    location: Optional[str] = None
    date: Optional[str] = None
    paid_by: str
    payment_method: Optional[str] = None
    items: List[Item] = []
    subtotal: Optional[float] = None
    taxes: List[Tax] = []
    total: Optional[float] = None
    confidence_score: float
    processing_time_ms: int
    request_id: str

router = APIRouter()
logger = logging.getLogger(__name__)

TEMP_UPLOAD_DIR = "temp_uploads"
os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)

@router.post("/scan-receipt", response_model=ReceiptResponse)
async def scan_receipt(
    receipt_image: UploadFile = File(...),
    paid_by_user_id: str = Form(...)
):
    start = time.time()
    request_id = str(uuid.uuid4())
    
    # 1. Structured Logging Start
    logger.info(json.dumps({
        "event": "scan_receipt_started",
        "request_id": request_id,
        "paid_by_user_id": paid_by_user_id,
        "filename": receipt_image.filename,
        "content_type": receipt_image.content_type
    }))
    
    if not receipt_image.filename:
        return JSONResponse(status_code=400, content={"error": "No file uploaded"})
    
    # 2. MIME and Extension Validation
    file_ext = os.path.splitext(receipt_image.filename)[1].lower()
    if not file_ext or file_ext not in ALLOWED_EXTENSIONS:
        return JSONResponse(status_code=400, content={"error": f"Invalid file extension. Allowed: {ALLOWED_EXTENSIONS}"})
        
    if receipt_image.content_type not in ALLOWED_MIME_TYPES:
        return JSONResponse(status_code=400, content={"error": f"Invalid MIME type. Allowed: {ALLOWED_MIME_TYPES}"})
    
    temp_filename = f"{uuid.uuid4().hex}{file_ext}"
    temp_file_path = os.path.join(TEMP_UPLOAD_DIR, temp_filename)
    
    try:
        # 3. Size enforcement via Streaming logic instead of in-memory load
        file_size = 0
        with open(temp_file_path, "wb") as f:
            while chunk := await receipt_image.read(1024 * 1024):  # 1MB chunks
                file_size += len(chunk)
                if file_size > MAX_FILE_SIZE:
                    raise HTTPException(status_code=413, detail="File too large. Maximum size is 5MB.")
                f.write(chunk)
            
        logger.info(json.dumps({
            "event": "file_saved",
            "request_id": request_id,
            "filepath": temp_file_path,
            "size_bytes": file_size
        }))
        
        # 4. Process execution with timeout protection
        # We wrap the synchronous process_receipt in asyncio.to_thread and then apply asyncio.wait_for
        result = await asyncio.wait_for(
            asyncio.to_thread(process_receipt, temp_file_path, paid_by_user_id),
            timeout=PROCESS_TIMEOUT_SECONDS
        )
        
        elapsed = int((time.time() - start) * 1000)
        result["processing_time_ms"] = elapsed
        result["request_id"] = request_id
        
        logger.info(json.dumps({
            "event": "scan_receipt_completed",
            "request_id": request_id,
            "processing_time_ms": elapsed,
            "confidence_score": result.get("confidence_score")
        }))
        
        return ReceiptResponse(**result)
        
    except asyncio.TimeoutError:
        logger.error(json.dumps({
            "event": "scan_timeout",
            "request_id": request_id,
            "error": f"Processing exceeded {PROCESS_TIMEOUT_SECONDS} seconds."
        }))
        return JSONResponse(status_code=504, content={"error": "Processing timeout. The receipt image took too long to analyze."})
        
    except HTTPException as e:
        return JSONResponse(status_code=e.status_code, content={"error": e.detail})
        
    except Exception as e:
        logger.error(json.dumps({
            "event": "scan_error",
            "request_id": request_id,
            "error": str(e)
        }), exc_info=True)
        return JSONResponse(status_code=500, content={"error": "An internal error occurred during processing."})
        
    finally:
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception as e:
                logger.warning(json.dumps({
                    "event": "cleanup_error",
                    "request_id": request_id,
                    "error": str(e),
                    "filepath": temp_file_path
                }))
