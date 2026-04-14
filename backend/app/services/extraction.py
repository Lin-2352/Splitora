import re
from typing import Optional, List, Dict, Any, TypedDict

def clean_price(price_str: str) -> float:
    """Helper to convert OCR price strings with spaces or O's to float."""
    # Replace comma with dot
    price_str = price_str.replace(',', '.')
    # Replace letter O with 0
    price_str = price_str.replace('O', '0').replace('o', '0')
    # Remove spaces
    price_str = price_str.replace(' ', '')
    return float(price_str)

class TaxItem(TypedDict):
    type: str
    amount: float

class TotalsAndTaxes(TypedDict):
    total: Optional[float]
    subtotal: Optional[float]
    taxes: List[TaxItem]

def extract_vendor(lines: List[str]) -> Optional[str]:
    """Extract vendor name using structural heuristics."""
    skip_keywords = [
        "thank", "visit", "download", "order online", 
        "road", "street", "floor", "nagar", "state", "pin", "code",
        "invoice", "bill", "receipt"
    ]
    
    for i, line in enumerate(lines):
        if i >= 15:
            break
        lower_line = line.lower()
        
        # Skip pure digits
        if line.replace(" ", "").isdigit():
            continue
            
        # Skip phone numbers
        if re.search(r'\d{10,}', line.replace(" ", "")):
            continue
            
        # Skip price matches (handling OCR spaces and O's)
        if re.search(r'\d+[.,]\s*[0-9Oo]{2}', line):
            continue
            
        # Skip address/marketing keywords/document headers
        if any(keyword in lower_line for keyword in skip_keywords):
            continue
            
        # Check heuristics: <= 6 words and mostly alphabetic
        words = line.split()
        if len(words) <= 6 and len(line.replace(" ", "")) >= 4:
            alpha_chars = sum(c.isalpha() for c in line)
            total_chars = len(line.replace(" ", ""))
            
            if total_chars > 0 and (alpha_chars / total_chars) > 0.6:
                return line
                
    return None

def extract_date(text: str) -> Optional[str]:
    """Extract first valid date pattern, allowing for OCR whitespace around separators."""
    date_patterns = [
        r'\d{2}\s*[/-]\s*\d{2}\s*[/-]\s*\d{2,4}',  # DD/MM/YYYY or DD-MM-YYYY with optional spaces
        r'\d{4}\s*[/-]\s*\d{2}\s*[/-]\s*\d{2}',     # YYYY-MM-DD
        r'\d{2}\s*\.\s*\d{2}\s*\.\s*\d{2,4}'        # DD.MM.YYYY
    ]
    
    for pattern in date_patterns:
        match = re.search(pattern, text)
        if match:
            # Clean up the extracted date by removing extra spaces
            return match.group(0).replace(" ", "")
            
    return None

def extract_items(lines: List[str]) -> List[Dict[str, Any]]:
    """Extract individual items and prices."""
    items: List[Dict[str, Any]] = []
    
    ignore_keywords = ["total", "subtotal", "gst", "tax", "cgst", "sgst", "igst", "state", "code", "due"]
    
    for line in lines:
        # Match rightmost price on line, allowing spaces or O's in decimal part
        match = re.search(r'(.+)\s+(\d+[.,]\s*[0-9Oo]{2})$', line)
        
        if match:
            raw_name = match.group(1).strip()
            price_str = match.group(2)
            
            lower_name = raw_name.lower()
            
            # Exclude lines with total/tax keywords
            if any(keyword in lower_line for keyword in ignore_keywords for lower_line in [lower_name]):
                continue
                
            # Clean up the name
            # Remove quantity prefixes like "1 " or "2x "
            clean_name = re.sub(r'^\d+\s*x?\s*', '', raw_name, flags=re.IGNORECASE)
            # Remove leading symbols
            clean_name = re.sub(r'^[\s\|\:\-]+', '', clean_name).strip()
            
            if clean_name:
                try:
                    price = clean_price(price_str)
                    items.append({"name": clean_name, "price": price})
                except ValueError:
                    continue
                    
    return items

def extract_totals_and_taxes(text: str, lines: List[str]) -> Dict[str, Any]:
    """Extract exact Total, Subtotal and array of Taxes."""
    total: Optional[float] = None
    subtotal: Optional[float] = None
    taxes: List[Dict[str, Any]] = []
    
    # Extract Subtotal
    subtotal_match = re.search(r'Sub[Tt]otal\s+(\d+[.,]\s*[0-9Oo]{2})', text)
    if subtotal_match:
        try:
            subtotal = clean_price(subtotal_match.group(1))
        except ValueError:
            pass
        
    # Extract exact Total (strict match to avoid "Total Qty", "Taxable Amount")
    for line in lines:
        if "subtotal" in line.lower() or "sub total" in line.lower():
            continue
            
        total_match = re.search(r'\b(?:Grand\s+)?Total\b(?:[^\d]+)?(\d+[.,]\s*[0-9Oo]{2})$', line, re.IGNORECASE)
        # fallback for "Amount" or "Amt"
        if not total_match:
             total_match = re.search(r'\b(?:Amount|Amt)\b\s*(?::)?\s*(?:[^\d]+)?(\d+[.,]\s*[0-9Oo]{2})$', line, re.IGNORECASE)
             
        if total_match:
            try:
                total = clean_price(total_match.group(1))
                break # Take the first valid total match
            except ValueError:
                continue
                
    # Extract Taxes (CGST, SGST, IGST, Tax)
    tax_keywords = ["cgst", "sgst", "igst", "tax"]
    
    for line in lines:
        lower_line = line.lower()
        if any(tax in lower_line for tax in tax_keywords):
            # Capture rightmost price for the tax
            tax_match = re.search(r'(.+)\s+(\d+[.,]\s*[0-9Oo]{2})$', line)
            if tax_match:
                tax_type_raw = tax_match.group(1).strip()
                tax_amount_str = tax_match.group(2)
                
                # Assign a clean tax type label
                tax_type = "Tax"
                for keyword in tax_keywords:
                    if keyword in lower_line:
                        tax_type = keyword.upper()
                        break
                        
                try:
                    taxes.append({
                        "type": tax_type,
                        "amount": clean_price(tax_amount_str)
                    })
                except ValueError:
                    pass

    return {"total": total, "subtotal": subtotal, "taxes": taxes}

def extract_bill_data(text: str) -> dict:
    """Main extraction coordinator returning raw extracted fields."""
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    totals_taxes = extract_totals_and_taxes(text, lines)
    
    return {
        "vendor": extract_vendor(lines),
        "date": extract_date(text),
        "items": extract_items(lines),
        "subtotal": totals_taxes["subtotal"],
        "total": totals_taxes["total"],
        "taxes": totals_taxes["taxes"],
    }
