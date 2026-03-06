from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
from io import BytesIO

from model_loader import get_model
from predictor import image_to_tensor, run_prediction

app = FastAPI(
    title="HQCNN Medical API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    print("🚀 Khởi động server...")
    get_model()
    print("✅ Sẵn sàng!")

@app.get("/")
async def root():
    return {"message": "HQCNN Medical API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "model": "HQCNN_V2", "n_qubits": 8}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Kiểm tra file type
    if file.content_type not in [
        "image/jpeg", "image/png", "image/jpg", "image/webp"]:
        raise HTTPException(400,
            detail=f"Không hỗ trợ {file.content_type}. Dùng JPG/PNG.")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(400, detail="File quá lớn. Tối đa 10MB.")

    try:
        pil_image    = Image.open(BytesIO(contents)).convert('L')
        image_tensor = image_to_tensor(pil_image)
        model        = get_model()
        result       = run_prediction(model, image_tensor)
        return JSONResponse({"success": True, "data": result})
    except Exception as e:
        raise HTTPException(500, detail=f"Lỗi: {str(e)}")
