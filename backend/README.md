# Universal Receipt Scanner API

This project exposes the Universal Receipt Scanner pipeline as a production-ready API endpoint, allowing backend services to send images and receive structured expense data.

## Requirements

Ensure you have installed the required dependencies:
```bash
pip install fastapi uvicorn python-multipart pydantic
```

## Running the API Server

Start the application with Uvicorn:

```bash
uvicorn main:app --reload --port 8000
```
This will start the server on `http://localhost:8000`.

## Endpoints

### 1. Process Receipt (`POST /scan-receipt`)

Analyzes an uploaded receipt image and returns structured expense data.

- **URL**: `/scan-receipt`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`

#### Parameters

- `receipt_image` (File): The image file of the receipt (e.g., .jpg, .png).
- `paid_by_user_id` (String): The ID of the user submitting the receipt.

#### Example Curl Request

```bash
curl -X POST "http://localhost:8000/scan-receipt" \
  -F "receipt_image=@sample.jpg" \
  -F "paid_by_user_id=user_987654"
```

#### Example Response

```json
{
  "vendor": "McDonalds",
  "location": "New York, NY",
  "date": "2023-10-05T12:00:00",
  "paid_by": "user_987654",
  "payment_method": "Credit Card",
  "items": [
    {
      "name": "Big Mac",
      "price": 5.99,
      "category": "Food"
    }
  ],
  "subtotal": 5.99,
  "taxes": [],
  "total": 5.99,
  "confidence_score": 0.85
}
```

### 2. Health Check (`GET /health`)

Verifies the server is running.

- **URL**: `/health`
- **Method**: `GET`

#### Example Response
```json
{
  "status": "running"
}
```

## API Documentation

FastAPI provides automatic interactive API documentation. Once the server is running, you can access generating docs at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
