import re
from typing import Dict, List, Any, Optional

CATEGORY_KEYWORDS = {
    "Food": ["pizza", "burger", "meal", "combo", "coffee", "tea", "drink", "restaurant", "cafe", "bistro", "paneer", "chicken", "biryani", "rice", "curry", "water", "beverage", "snack"],
    "Medicine": ["tablet", "syrup", "capsule", "drop", "ointment", "cream", "gel", "injection", "pharmacy", "medical", "clinic", "hospital", "pharma"],
    "Groceries": ["milk", "bread", "egg", "butter", "cheese", "vegetable", "fruit", "meat", "fish", "oil", "sugar", "salt", "spice", "pulses", "dal", "atta", "flour", "soap", "detergent"],
    "Entertainment": ["movie", "ticket", "cinema", "theatre", "show", "event", "concert"],
    "Travel": ["flight", "train", "bus", "cab", "taxi", "ola", "uber", "ticket", "booking", "hotel", "stay", "room"],
    "Utilities": ["electricity", "water", "gas", "internet", "broadband", "recharge", "bill", "payment"],
    "Shopping": ["shirt", "pant", "jeans", "t-shirt", "dress", "shoe", "bag", "watch", "electronics", "mobile", "laptop"]
}

def classify_items(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Enrich items by assigning a category based on keyword matching."""
    enriched_items = []
    
    for item in items:
        name = item.get("name", "").lower()
        matched_category = "Other"
        
        for category, keywords in CATEGORY_KEYWORDS.items():
            if any(keyword.lower() in name for keyword in keywords):
                matched_category = category
                break  # Stop at first matched category
                
        enriched_item = item.copy()
        enriched_item["category"] = matched_category
        enriched_items.append(enriched_item)
        
    return enriched_items

def extract_payment_method(text: str) -> Optional[str]:
    """Detect payment method from OCR text block."""
    methods = ["upi", "credit", "debit", "cash", "visa", "mastercard", "amex", "paytm", "gpay", "phonepe", "card"]
    text_lower = text.lower()
    
    for method in methods:
        # Match standalone words or bounded identifiers to avoid generic substring matches
        if re.search(fr'\b{method}\b', text_lower):
            return method.capitalize() if method != "upi" else "UPI"
            
    return None

def extract_location(lines: List[str]) -> Optional[str]:
    """Extract location city from Indian postal codes."""
    for line in lines[:20]: # Usually near the top header
        # Match typical Indian 6-digit post codes (e.g., 700016, 400 053)
        match = re.search(r'\b([A-Z\s]+)(?:-|,\s*)?(\d{3}\s?\d{3})\b', line, re.IGNORECASE)
        if match:
            city_candidate = match.group(1).strip()
            # Clean up city candidate - don't want address parts
            bad_keywords = ["road", "street", "floor", "nagar", "pin", "code"]
            if not any(bw in city_candidate.lower() for bw in bad_keywords) and len(city_candidate) > 2:
                # Return just the city name part without the pin code
                return city_candidate.split(',')[-1].strip().split(' ')[-1].strip().capitalize()
                
            # If the city candidate is invalid, fallback to scanning just for the zip code and taking the previous word
            words = line.replace(',', ' ').replace('-', ' ').split()
            for i, word in enumerate(words):
                if re.match(r'^\d{6}$', word) and i > 0:
                    prev_word = words[i-1]
                    if not any(bw in prev_word.lower() for bw in bad_keywords) and not prev_word.isdigit():
                         return prev_word.capitalize()
                         
    return None

def enrich_receipt_data(data: Dict[str, Any], raw_text: str, paid_by_user_id: str) -> Dict[str, Any]:
    """Orchestrate enrichment logic (categorization, location parsing, API context integration)."""
    lines = [line.strip() for line in raw_text.split('\n') if line.strip()]
    
    enriched_data = data.copy()
    
    # 1. Classify Items
    if "items" in enriched_data:
        enriched_data["items"] = classify_items(enriched_data["items"])
        
    # 2. Extract Payment Method
    enriched_data["payment_method"] = extract_payment_method(raw_text)
    
    # 3. Extract Location
    enriched_data["location"] = extract_location(lines)
    
    # 4. Attach API User Context
    enriched_data["paid_by"] = paid_by_user_id
    
    return enriched_data
