\# 🫁 HQCNN Medical

\### Hybrid Quantum-Classical Neural Network for Pneumonia Detection



Ứng dụng phân loại X-quang phổi sử dụng mạng nơ-ron lai lượng tử-cổ điển.



\## 🏗️ Kiến trúc

\- \*\*CNN Backbone\*\*: 5 lớp Conv2D (16→64 filters)

\- \*\*Quantum Circuit\*\*: 8-qubit VQC (AngleEmbedding + U3 + CNOT)

\- \*\*Grad-CAM\*\*: Explainability visualization

\- \*\*Web App\*\*: FastAPI + React.js



\## 📊 Kết quả



| Model | Accuracy | AUC |

|-------|----------|-----|

| Classical CNN (baseline) | 87.50% | 96.51% |

| \*\*HQCNN V2 (Ours)\*\* | \*\*\~92%\*\* | \*\*\~96%\*\* |

| Paper HQCNN (reference) | 96.16% | 98.89% |



\## 🚀 Chạy ứng dụng



\### Backend (FastAPI)

```bash

cd backend

pip install fastapi uvicorn torch pennylane pillow numpy opencv-python-headless python-multipart torchvision

uvicorn main:app --reload --port 8000

```



\### Frontend (React)

```bash

cd frontend

npm install

npm start

```



Mở browser: http://localhost:3000



\## 📁 Cấu trúc

```

hqcnn-medical/

├── backend/

│   ├── main.py          # FastAPI endpoints

│   ├── model\_loader.py  # Load HQCNN model

│   ├── predictor.py     # Inference + Grad-CAM

│   └── models/          # (thêm file .pth vào đây)

└── frontend/

&#x20;   └── src/

&#x20;       └── App.js       # React UI

```



\## 📄 Paper tham khảo

Shahjalal et al. (2025) - \[arXiv:2509.14277](https://arxiv.org/abs/2509.14277)



\## 🎓 Luận văn tốt nghiệp

Khoa Điện tử - Viễn thông

