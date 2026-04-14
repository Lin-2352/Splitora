def validate_receipt_data(data: dict) -> dict:
    """Validate extracted fields and compute a confidence score (0.0 - 1.0)."""
    confidence_score = 1.0
    
    # Missing basic info
    if not data.get("vendor"):
        confidence_score -= 0.15
    if not data.get("date"):
        confidence_score -= 0.15
        
    items = data.get("items", [])
    if not items:
        confidence_score -= 0.3
        
    # Validation logic
    subtotal = data.get("subtotal")
    total = data.get("total")
    taxes = data.get("taxes", [])
    
    sum_items = sum(item.get("price", 0.0) for item in items)
    sum_taxes = sum(tax.get("amount", 0.0) for tax in taxes)
    
    # Conditional subtotal validation
    if subtotal is not None:
        if abs(sum_items - subtotal) > 1.0:
            confidence_score -= 0.25
            
        if total is not None:
            if abs(subtotal + sum_taxes - total) > 1.0:
                confidence_score -= 0.25
                
    # Bound confidence score
    confidence_score = max(0.0, min(1.0, confidence_score))
    
    # Attach score to data object
    data["confidence_score"] = float(f"{confidence_score:.2f}")
    return data
