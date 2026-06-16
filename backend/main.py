from fastapi import FastAPI, HTTPException, Depends, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, PlainTextResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
import json
from dotenv import load_dotenv
import secrets

from app.services.db_service import DatabaseService

load_dotenv()

app = FastAPI(title="HTA Cleaner Admin API", version="3.0.0")

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


def get_cors_origins() -> list[str]:
    raw_origins = os.getenv(
        "CORS_ORIGINS",
        '["https://localhost:2000", "https://127.0.0.1:2000", "https://192.168.20.50:2000", "http://localhost:2000", "http://127.0.0.1:2000", "http://192.168.20.50:2000", "https://rusyako.github.io"]',
    )
    try:
        parsed_origins = json.loads(raw_origins)
        if isinstance(parsed_origins, list):
            return [origin for origin in parsed_origins if isinstance(origin, str) and origin]
    except json.JSONDecodeError:
        pass
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBasic()

db_service = DatabaseService()


@app.on_event("startup")
def startup():
    db_service.init_db()


def verify_credentials(credentials: HTTPBasicCredentials = Depends(security)):
    user = db_service.authenticate(credentials.username, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Неверные учетные данные")
    return user


def verify_admin(user: dict = Depends(verify_credentials)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    return user


def verify_admin_or_manager(user: dict = Depends(verify_credentials)):
    if user["role"] not in ("admin", "manager"):
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    return user


# --- Models ---

class CabinetStatus(BaseModel):
    cabinet_number: str
    status: str
    last_cleaned: Optional[str] = None
    cleaner_name: Optional[str] = None
    qr_code: Optional[str] = None


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


class CreateUserRequest(BaseModel):
    username: str
    password: str
    role: str
    full_name: str
    manager_id: Optional[str] = None


class UpdateTabsRequest(BaseModel):
    tabs: List[str]


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class UpdateReportRequest(BaseModel):
    checklist: Optional[str] = None
    photos: Optional[List[str]] = None


class UserInfo(BaseModel):
    username: str
    role: str
    full_name: str
    manager_id: Optional[str] = None
    tabs: List[str]


# --- Root / Health ---

@app.get("/")
def read_root():
    return RedirectResponse(url=os.getenv("FRONTEND_APP_URL", "https://localhost:2000"), status_code=307)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


# --- Me ---

@app.get("/api/me")
def get_current_user(user: dict = Depends(verify_credentials)):
    return {
        "username": user["username"],
        "role": user["role"],
        "full_name": user["full_name"],
        "manager_id": user.get("manager_id"),
        "tabs": user.get("tabs", []),
    }


# --- Password ---

@app.put("/api/me/password")
def change_password(request: ChangePasswordRequest, user: dict = Depends(verify_credentials)):
    try:
        db_service.change_password(user["username"], request.old_password, request.new_password)
        return {"detail": "Пароль изменен"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# --- Users ---

@app.get("/api/users", response_model=List[UserInfo])
def list_users(user: dict = Depends(verify_admin)):
    return db_service.get_all_users()


@app.post("/api/users", response_model=UserInfo)
def create_user(request: CreateUserRequest, user: dict = Depends(verify_admin)):
    if request.role not in ("admin", "manager", "cleaner"):
        raise HTTPException(status_code=400, detail="Недопустимая роль")
    try:
        return db_service.create_user(
            request.username, request.password, request.role,
            request.full_name, request.manager_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/users/{username}")
def delete_user(username: str, user: dict = Depends(verify_admin)):
    try:
        db_service.delete_user(username, user["username"])
        return {"detail": f"Пользователь {username} удален"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# --- User Tabs ---

@app.get("/api/users/{username}/tabs")
def get_user_tabs(username: str, user: dict = Depends(verify_admin)):
    try:
        return db_service.get_user_tabs(username)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.put("/api/users/{username}/tabs")
def set_user_tabs(username: str, request: UpdateTabsRequest, user: dict = Depends(verify_admin)):
    try:
        db_service.set_user_tabs(username, request.tabs)
        return {"username": username, "tabs": request.tabs}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# --- Managers ---

@app.get("/api/managers")
def list_managers(user: dict = Depends(verify_admin_or_manager)):
    return db_service.get_managers()


# --- Settings ---

@app.get("/api/settings")
def get_all_settings(user: dict = Depends(verify_admin)):
    return db_service.get_settings()


# --- Cabinets ---

@app.get("/api/cabinets", response_model=List[CabinetStatus])
def get_cabinets(user: dict = Depends(verify_credentials)):
    return db_service.get_cabinet_statuses()


@app.post("/api/cabinets")
def create_cabinet(request: QRLinkRequest, user: dict = Depends(verify_admin_or_manager)):
    try:
        return db_service.create_cabinet(request.cabinet_number)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/cabinets/{cabinet_number}/qr")
def generate_cabinet_qr(cabinet_number: str, user: dict = Depends(verify_admin_or_manager)):
    try:
        return db_service.generate_cabinet_qr(cabinet_number, UPLOAD_DIR)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/cabinets/{cabinet_number}")
def delete_cabinet(cabinet_number: str, user: dict = Depends(verify_admin)):
    try:
        db_service.delete_cabinet(cabinet_number)
        return {"detail": "Кабинет удален"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# --- Upload ---

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...), user: dict = Depends(verify_credentials)):
    contents = await file.read()
    url = db_service.save_upload(UPLOAD_DIR, file.filename or "photo.jpg", contents)
    return {"url": url}


# --- Cleaners ---

@app.get("/api/cleaners")
def list_cleaners(user: dict = Depends(verify_admin_or_manager)):
    return db_service.get_cleaners()


# --- Analytics ---

@app.get("/api/analytics")
def get_analytics(user: dict = Depends(verify_admin_or_manager)):
    return db_service.get_analytics()


# --- Reports ---

@app.get("/api/reports", response_model=List[Report])
def get_reports(
    user: dict = Depends(verify_credentials),
    cabinet_number: Optional[str] = None,
    date: Optional[str] = None,
    cleaner_username: Optional[str] = None,
):
    target_cleaner = None
    if cleaner_username and user["role"] in ("admin", "manager"):
        target_cleaner = cleaner_username
    elif user["role"] == "cleaner":
        target_cleaner = user["username"]
    return db_service.get_reports(
        cabinet_number=cabinet_number,
        date=date,
        cleaner_username=target_cleaner,
    )


@app.get("/api/reports/export/csv")
def export_reports_csv(user: dict = Depends(verify_admin_or_manager)):
    csv_data = db_service.export_reports_csv()
    return PlainTextResponse(csv_data, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=reports.csv"})


@app.get("/api/reports/{report_id}")
def get_report_detail(report_id: int, user: dict = Depends(verify_credentials)):
    try:
        return db_service.get_report_by_id(report_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/reports", response_model=Report)
def create_report(request: CreateReportRequest, user: dict = Depends(verify_credentials)):
    return db_service.create_report(
        cleaner_username=user["username"],
        cabinet_number=request.cabinet_number,
        checklist=request.checklist,
        photos=request.photos or [],
    )


@app.put("/api/reports/{report_id}", response_model=Report)
def update_report(report_id: int, request: UpdateReportRequest, user: dict = Depends(verify_admin)):
    try:
        return db_service.update_report(report_id, request.checklist, request.photos)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.delete("/api/reports/{report_id}")
def delete_report(report_id: int, user: dict = Depends(verify_admin)):
    try:
        db_service.delete_report(report_id)
        return {"detail": "Отчет удален"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# --- QR ---

@app.post("/api/qr-link")
def generate_qr_link(request: QRLinkRequest, user: dict = Depends(verify_admin_or_manager)):
    link = db_service.generate_qr_link(request.cabinet_number)
    return {"cabinet_number": request.cabinet_number, "link": link}


# --- Stats ---

@app.get("/api/stats")
def get_statistics(user: dict = Depends(verify_admin_or_manager)):
    return db_service.get_statistics()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", 8000)),
        reload=True,
    )
