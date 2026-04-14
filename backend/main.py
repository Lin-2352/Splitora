from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.receipt_api import router as receipt_router

app = FastAPI(
    title="Universal Receipt Scanner API",
    description="API to extract structured expense data from receipt images",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, specify the frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(receipt_router)

@app.get("/health")
def health_check():
    return {"status": "running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
