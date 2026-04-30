from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
import json
from dotenv import load_dotenv
import secrets
from functools import lru_cache

from app.services.report_data import ReportDataService

load_dotenv()

app = FastAPI(title="HTA Cleaner Admin API", version="1.0.0")


def get_cors_origins() -> list[str]:
    raw_origins = os.getenv(
        "CORS_ORIGINS",
        '["https://localhost:2000", "https://127.0.0.1:2000", "https://192.168.20.233:2000", "http://localhost:2000", "http://127.0.0.1:2000", "http://192.168.20.233:2000"]',
    )

    try:
        parsed_origins = json.loads(raw_origins)
        if isinstance(parsed_origins, list):
            return [origin for origin in parsed_origins if isinstance(origin, str) and origin]
    except json.JSONDecodeError:
        pass

    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBasic()

# User roles
USERS = {
    "admin": {
        "password": os.getenv("ADMIN_PASSWORD", "admin"),
        "role": "admin",
        "full_name": "Администратор"
    },
    "cleaner": {
        "password": os.getenv("CLEANER_PASSWORD", "cleaner"),
        "role": "cleaner",
        "full_name": "Клинер"
    }
}

def verify_credentials(credentials: HTTPBasicCredentials = Depends(security)):
    user = USERS.get(credentials.username)
    if not user:
        raise HTTPException(status_code=401, detail="Неверные учетные данные")
    
    correct_password = secrets.compare_digest(
        credentials.password, user["password"]
    )
    if not correct_password:
        raise HTTPException(status_code=401, detail="Неверные учетные данные")
    
    return {"username": credentials.username, "role": user["role"], "full_name": user["full_name"]}

def verify_admin(user: dict = Depends(verify_credentials)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    return user

@lru_cache(maxsize=1)
def get_report_data_service() -> ReportDataService:
    return ReportDataService()

# Models
class CabinetStatus(BaseModel):
    cabinet_number: str
    status: str  # green, yellow
    last_cleaned: Optional[str] = None
    cleaner_name: Optional[str] = None

class Report(BaseModel):
    id: int
    timestamp: str
    role: str
    cabinet_number: str
    checklist: Optional[str] = None
    photos: Optional[List[str]] = None

class QRLinkRequest(BaseModel):
    cabinet_number: str

class CreateReportRequest(BaseModel):
    cabinet_number: str
    checklist: str
    photos: Optional[List[str]] = None

# Routes
@app.get("/")
def read_root():
    frontend_app_url = os.getenv("FRONTEND_APP_URL", "https://localhost:2000")
    return RedirectResponse(url=frontend_app_url, status_code=307)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.get("/api/me")
def get_current_user(user: dict = Depends(verify_credentials)):
    """Получить информацию о текущем пользователе"""
    return {"username": user["username"], "role": user["role"], "full_name": user["full_name"]}

@app.get("/api/cabinets", response_model=List[CabinetStatus])
def get_cabinets(user: dict = Depends(verify_credentials)):
    """Получить статусы всех кабинетов"""
    try:
        return get_report_data_service().get_cabinet_statuses()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reports", response_model=List[Report])
def get_reports(
    user: dict = Depends(verify_credentials),
    cabinet_number: Optional[str] = None,
    date: Optional[str] = None
):
    """Получить отчеты с фильтрацией"""
    try:
        cleaner_username = user["username"] if user["role"] == "cleaner" else None
        return get_report_data_service().get_reports(
            cabinet_number=cabinet_number,
            date=date,
            cleaner_username=cleaner_username,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reports/{report_id}")
def get_report_detail(report_id: int, user: dict = Depends(verify_credentials)):
    """Получить детали конкретного отчета"""
    try:
        return get_report_data_service().get_report_by_id(report_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/qr-link")
def generate_qr_link(request: QRLinkRequest, user: dict = Depends(verify_admin)):
    """Генерировать ссылку для QR-кода кабинета (только админ)"""
    try:
        link = get_report_data_service().generate_qr_link(request.cabinet_number)
        return {"cabinet_number": request.cabinet_number, "link": link}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/reports", response_model=Report)
def create_report(request: CreateReportRequest, user: dict = Depends(verify_credentials)):
    """Создать отчет уборки"""
    try:
        return get_report_data_service().create_report(
            cleaner_username=user["username"],
            cabinet_number=request.cabinet_number,
            checklist=request.checklist,
            photos=request.photos or [],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats")
def get_statistics(user: dict = Depends(verify_admin)):
    """Получить общую статистику (только админ)"""
    try:
        return get_report_data_service().get_statistics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", 8000)),
        reload=True
    )
