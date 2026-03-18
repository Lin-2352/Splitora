import logging
import os
import sys
from pathlib import Path

# Setup simple logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# Ensure the root directory of the project is in PYTHONPATH
sys.path.insert(0, str(Path("d:/receipt-scanner-money-managment")))

from app.services.receipt_pipeline import process_receipt

def main():
    sample_bills_dir = Path("d:/receipt-scanner-money-managment/sample_bills")
    
    # Running 3 different formats as required
    test_files = [
        "dominoz-bill1.jpg", 
        "food-bill2.jpg", 
        "medicine-bill1.jpg"
    ]
    
    for filename in test_files:
        image_path = sample_bills_dir / filename
        if not image_path.exists():
            print(f"Skipping {filename}: File not found.")
            continue
            
        print(f"\n{'='*50}")
        print(f"Testing Pipeline on: {filename}")
        print(f"{'='*50}\n")
        
        try:
            result = process_receipt(str(image_path))
            
            # Simple assertions based on the verification plan
            assert len(result.get("items", [])) > 0, "No items were successfully extracted."
            assert result.get("total") is not None, "Total amount could not be extracted."
            assert result.get("confidence_score", 0.0) >= 0.5, "Confidence score fell below 0.5."
            
            # Pretty print output without the massive raw_text log for readability
            print("\nFinal Pipeline Output Schema:")
            for k, v in result.items():
                if k != "raw_text":
                    print(f"  {k}: {v}")
                    
            print("\n✅ Verification passed for this file!")
            
        except Exception as e:
            print(f"\n❌ Pipeline failed on {filename}: {e}")
            raise e

if __name__ == "__main__":
    main()
