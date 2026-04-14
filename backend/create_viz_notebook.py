import json

notebook = {
 "cells": [
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Universal Receipt Scanner - Full Pipeline Visualization\n",
    "This notebook demonstrates the step-by-step execution of the receipt scanner pipeline."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "import sys\n",
    "import os\n",
    "import cv2\n",
    "import re\n",
    "import json\n",
    "import pandas as pd\n",
    "import matplotlib.pyplot as plt\n",
    "from IPython.display import display, HTML, Markdown\n",
    "\n",
    "# Add project root to path\n",
    "sys.path.append(os.path.abspath('..'))\n",
    "\n",
    "from app.services.preprocessing import preprocess_image\n",
    "from app.services.ocr_service import run_ocr\n",
    "from app.services.extraction import extract_bill_data\n",
    "from app.services.enrichment import enrich_receipt_data\n",
    "from app.services.validation import validate_receipt_data\n",
    "from app.services.json_formatter import format_receipt_json\n"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "### Select Sample Receipt"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "image_path = '../sample_bills/dominoz-bill1.jpg'\n",
    "paid_by_user_id = 'user_987654'\n"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## STEP 1 \u2014 Visualize Preprocessing"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "image = preprocess_image(image_path)\n",
    "\n",
    "plt.figure(figsize=(10, 10))\n",
    "plt.imshow(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))\n",
    "plt.title('Preprocessed Image (2.5x Upscale)')\n",
    "plt.axis('off')\n",
    "plt.show()\n"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## STEP 2 \u2014 Visualize OCR Output"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "raw_text = run_ocr(image)\n",
    "lines = [line.strip() for line in raw_text.split('\\n') if line.strip()]\n",
    "\n",
    "print(f\"Character Count: {len(raw_text)}\")\n",
    "print(f\"Detected Lines: {len(lines)}\")\n",
    "print(\"-\" * 40)\n",
    "# Show in scrollable output box\n",
    "display(HTML(f'<div style=\"height: 300px; overflow-y: scroll; border: 1px solid #ccc; padding: 10px; white-space: pre-wrap;\">{raw_text}</div>'))\n"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## STEP 3 \u2014 Visualize Line Splitting"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "price_pattern = re.compile(r'(.+)\\s+(\\d+[.,]\\s*[0-9Oo]{2})$')\n",
    "\n",
    "html_output = \"<div style='background-color: #f7f7f7; padding: 10px; font-family: monospace;'>\"\n",
    "for i, line in enumerate(lines):\n",
    "    if price_pattern.search(line):\n",
    "        html_output += f\"<div style='color: green;'>[{i}] {line}</div>\"\n",
    "    else:\n",
    "        html_output += f\"<div style='color: black;'>[{i}] {line}</div>\"\n",
    "html_output += \"</div>\"\n",
    "\n",
    "display(HTML(html_output))\n"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## STEP 4 & 5 \u2014 Validation & Enrichment Execution"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "extracted_data = extract_bill_data(raw_text)\n",
    "validated_data = validate_receipt_data(extracted_data)\n",
    "enriched_data = enrich_receipt_data(validated_data, raw_text, paid_by_user_id)\n"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## STEP 6 \u2014 Visualize Category Item Extraction"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "items = enriched_data.get('items', [])\n",
    "\n",
    "df_items = pd.DataFrame(items, columns=['name', 'price', 'category'])\n",
    "display(df_items)\n",
    "\n",
    "sum_items = sum(item.get('price', 0.0) for item in items)\n",
    "print(f\"\\nSum of Item Prices: {sum_items:.2f}\")\n"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## STEP 7 \u2014 Visualize Finance & Semantic Blocks"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "subtotal = enriched_data.get('subtotal')\n",
    "total = enriched_data.get('total')\n",
    "taxes = enriched_data.get('taxes', [])\n",
    "location = enriched_data.get('location')\n",
    "payment_method = enriched_data.get('payment_method')\n",
    "\n",
    "print(f\"Extracted Location: {location}\")\n",
    "print(f\"Payment Method: {payment_method}\")\n",
    "print(f\"Paid By User Context: {enriched_data.get('paid_by')}\")\n",
    "print(\"-\" * 30)\n",
    "print(f\"Extracted Subtotal: {subtotal}\")\n",
    "print(f\"Extracted Total: {total}\")\n",
    "print(f\"\\nTaxes:\")\n",
    "df_taxes = pd.DataFrame(taxes, columns=['type', 'amount']) if taxes else pd.DataFrame(columns=['type', 'amount'])\n",
    "display(df_taxes)\n"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## STEP 8 \u2014 Score Generation Log"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "sum_taxes = sum(tax.get('amount', 0.0) for tax in taxes)\n",
    "calc_subtotal_diff = abs(sum_items - subtotal) if subtotal is not None else 0.0\n",
    "calc_total_diff = abs((subtotal or 0.0) + sum_taxes - total) if total is not None else 0.0\n",
    "\n",
    "print(\"Validation Calculations:\")\n",
    "print(f\"Item Sum: {sum_items:.2f}\")\n",
    "print(f\"Subtotal: {(subtotal or 'N/A')}\")\n",
    "print(f\"Difference: {calc_subtotal_diff:.2f}\")\n",
    "print(\"-\" * 30)\n",
    "print(f\"Sum Taxes: {sum_taxes:.2f}\")\n",
    "print(f\"Total: {(total or 'N/A')}\")\n",
    "print(f\"Total Difference: {calc_total_diff:.2f}\")\n",
    "print(\"-\" * 30)\n",
    "print(f\"Final Confidence Score: {enriched_data.get('confidence_score')}\")\n"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## STEP 9 \u2014 Visualize Final Enriched JSON"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "final_json = format_receipt_json(enriched_data)\n",
    "print(json.dumps(final_json, indent=4))\n"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## STEP 10 \u2014 Pipeline Recap Summary"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "comparison_md = f\"\"\"| Feature | Value |\n",
    "|-------|-------|\n",
    "| Pipeline Stage | Evaluated & Enriched |\n",
    "| Payer UUID | {enriched_data.get('paid_by')} |\n",
    "| Mapped Location | {location} |\n",
    "| Category Parsing | {len(items)} Items Scanned |\n",
    "| Subtotal | {subtotal} |\n",
    "| Grand Total | {total} |\n",
    "| Structural Confidence | {enriched_data.get('confidence_score')} |\n",
    "\"\"\"\n",
    "display(Markdown(comparison_md))\n"
   ]
  }
 ],
 "metadata": {
  "kernelspec": {
   "display_name": "Python 3",
   "language": "python",
   "name": "python3"
  },
  "language_info": {
   "codemirror_mode": {
    "name": "ipython",
    "version": 3
   },
   "file_extension": ".py",
   "mimetype": "text/x-python",
   "name": "python",
   "nbconvert_exporter": "python",
   "pygments_lexer": "ipython3",
   "version": "3.8.0"
  }
 },
 "nbformat": 4,
 "nbformat_minor": 4
}

with open("d:/receipt-scanner-money-managment/notebooks/05_full_pipeline_test.ipynb", "w", encoding="utf-8") as f:
    json.dump(notebook, f, indent=1)
