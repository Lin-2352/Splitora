import sys
import os
sys.path.append(os.path.abspath('..'))
from app.services.preprocessing import preprocess_image
from app.services.ocr_service import run_ocr
from app.services.extraction import extract_bill_data
from app.services.enrichment import enrich_receipt_data
import pandas as pd
from IPython.display import display

image_path = '../sample_bills/dominoz-bill1.jpg'
raw_text = run_ocr(preprocess_image(image_path))
extracted_data = extract_bill_data(raw_text)
enriched_data = enrich_receipt_data(extracted_data, raw_text, 'user_123')

items = enriched_data.get('items', [])
df = pd.DataFrame(items, columns=['name', 'price', 'category'])
display(df)

print('Location:', enriched_data.get('location'))
print('Payment Method:', enriched_data.get('payment_method'))
print('Paid By:', enriched_data.get('paid_by'))
