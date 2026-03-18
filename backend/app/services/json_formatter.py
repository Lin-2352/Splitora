def format_receipt_json(data: dict, raw_text: str = None) -> dict:
    """Map validated and enriched data to the final expected DB schema structure."""
    
    # Ensure items conform perfectly to schema
    formatted_items = []
    for item in data.get("items", []):
        formatted_items.append({
            "name": item.get("name"),
            "price": item.get("price"),
            "category": item.get("category")
        })
        
    final_dict = {
        "vendor": data.get("vendor"),
        "location": data.get("location"),
        "date": data.get("date"),
        "paid_by": data.get("paid_by"),
        "payment_method": data.get("payment_method"),
        "items": formatted_items,
        "subtotal": data.get("subtotal"),
        "taxes": data.get("taxes", []),
        "total": data.get("total"),
        "confidence_score": data.get("confidence_score")
    }
    
    if raw_text is not None:
        final_dict["raw_text"] = raw_text
        
    return final_dict
