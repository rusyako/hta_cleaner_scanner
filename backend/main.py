from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, FileResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import os
import json
from dotenv import load_dotenv
import secrets
from functools import lru_cache
from copy import deepcopy

from app.services.report_data import ReportDataService

load_dotenv()

app = FastAPI(title="HTA Cleaner Admin API", version="2.0.0")


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

# --- Users ---

USERS: Dict[str, Dict[str, Any]] = {
    "admin": {
        "password": os.getenv("ADMIN_PASSWORD", "admin"),
        "role": "admin",
        "full_name": "Администратор",
        "manager_id": None,
    },
    "manager": {
        "password": os.getenv("MANAGER_PASSWORD", "manager"),
        "role": "manager",
        "full_name": "Руководитель",
        "manager_id": "mgr_1",
    },
    "cleaner": {
        "password": os.getenv("CLEANER_PASSWORD", "cleaner"),
        "role": "cleaner",
        "full_name": "Клинер",
        "manager_id": "mgr_1",
    },
}

DEFAULT_TABS: Dict[str, List[str]] = {
    "admin":   ["dashboard", "cabinets", "reports", "qr-generator", "managers", "users", "settings"],
    "manager": ["dashboard", "cabinets", "reports", "qr-generator"],
    "cleaner": ["scan", "my-reports"],
}

USER_TABS: Dict[str, List[str]] = {}

TAB_LABELS: Dict[str, Dict[str, str]] = {
    "dashboard":    {"ru": "Дашборд",        "en": "Dashboard"},
    "cabinets":     {"ru": "Кабинеты",       "en": "Cabinets"},
    "reports":      {"ru": "Отчеты",         "en": "Reports"},
    "qr-generator": {"ru": "QR-коды",        "en": "QR Codes"},
    "managers":     {"ru": "Руководители",   "en": "Managers"},
    "users":        {"ru": "Пользователи",   "en": "Users"},
    "settings":     {"ru": "Настройки",      "en": "Settings"},
    "scan":         {"ru": "Скан",           "en": "Scan"},
    "my-reports":   {"ru": "Мои отчеты",     "en": "My Reports"},
}


def get_user_tabs(username: str) -> List[str]:
    if username in USER_TABS:
        return USER_TABS[username]
    role = USERS[username]["role"]
    return deepcopy(DEFAULT_TABS.get(role, []))


def verify_credentials(credentials: HTTPBasicCredentials = Depends(security)):
    user = USERS.get(credentials.username)
    if not user:
        raise HTTPException(status_code=401, detail="Неверные учетные данные")
    correct_password = secrets.compare_digest(credentials.password, user["password"])
    if not correct_password:
        raise HTTPException(status_code=401, detail="Неверные учетные данные")
    return {
        "username": credentials.username,
        "role": user["role"],
        "full_name": user["full_name"],
        "manager_id": user.get("manager_id"),
    }


def verify_admin(user: dict = Depends(verify_credentials)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    return user


def verify_admin_or_manager(user: dict = Depends(verify_credentials)):
    if user["role"] not in ("admin", "manager"):
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    return user


@lru_cache(maxsize=1)
def get_report_data_service() -> ReportDataService:
    return ReportDataService()


# --- Pydantic Models ---

class CabinetStatus(BaseModel):
    cabinet_number: str
    status: str
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


class CreateUserRequest(BaseModel):
    username: str
    password: str
    role: str
    full_name: str
    manager_id: Optional[str] = None


class UpdateTabsRequest(BaseModel):
    tabs: List[str]


class UserInfo(BaseModel):
    username: str
    role: str
    full_name: str
    manager_id: Optional[str] = None
    tabs: List[str]


# --- Routes ---

@app.get("/")
def read_root():
    return RedirectResponse(url=os.getenv("FRONTEND_APP_URL", "https://localhost:2000"), status_code=307)


@app.get("/api/cert")
def download_cert():
    cert_path = "/app/certs/hta-root-ca.crt"
    if not os.path.exists(cert_path):
        cert_path = "/app/certs/hta-root-ca.pem"
    if not os.path.exists(cert_path):
        raise HTTPException(status_code=404, detail="Certificate not found")
    return FileResponse(cert_path, media_type="application/x-x509-ca-cert", filename="HTA_Root_CA.crt")


@app.get("/api/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


@app.get("/api/me")
def get_current_user(user: dict = Depends(verify_credentials)):
    tabs = get_user_tabs(user["username"])
    return {
        "username": user["username"],
        "role": user["role"],
        "full_name": user["full_name"],
        "manager_id": user.get("manager_id"),
        "tabs": tabs,
    }


# --- Users CRUD ---

@app.get("/api/users", response_model=List[UserInfo])
def list_users(user: dict = Depends(verify_admin)):
    result = []
    for username, data in USERS.items():
        result.append(UserInfo(
            username=username,
            role=data["role"],
            full_name=data["full_name"],
            manager_id=data.get("manager_id"),
            tabs=get_user_tabs(username),
        ))
    return result


@app.post("/api/users", response_model=UserInfo)
def create_user(request: CreateUserRequest, user: dict = Depends(verify_admin)):
    if request.username in USERS:
        raise HTTPException(status_code=400, detail="Пользователь уже существует")
    if request.role not in ("admin", "manager", "cleaner"):
        raise HTTPException(status_code=400, detail="Недопустимая роль")
    USERS[request.username] = {
        "password": request.password,
        "role": request.role,
        "full_name": request.full_name,
        "manager_id": request.manager_id,
    }
    return UserInfo(
        username=request.username,
        role=request.role,
        full_name=request.full_name,
        manager_id=request.manager_id,
        tabs=get_user_tabs(request.username),
    )


@app.delete("/api/users/{username}")
def delete_user(username: str, user: dict = Depends(verify_admin)):
    if username == "admin":
        raise HTTPException(status_code=400, detail="Нельзя удалить администратора")
    if username == user["username"]:
        raise HTTPException(status_code=400, detail="Нельзя удалить самого себя")
    if username not in USERS:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    del USERS[username]
    USER_TABS.pop(username, None)
    return {"detail": f"Пользователь {username} удален"}


# --- Tabs settings ---

@app.get("/api/users/{username}/tabs")
def get_user_tabs_endpoint(username: str, user: dict = Depends(verify_admin)):
    if username not in USERS:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    tabs = get_user_tabs(username)
    return {"username": username, "tabs": tabs, "role": USERS[username]["role"]}


@app.put("/api/users/{username}/tabs")
def set_user_tabs(username: str, request: UpdateTabsRequest, user: dict = Depends(verify_admin)):
    if username not in USERS:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    USER_TABS[username] = request.tabs
    return {"username": username, "tabs": request.tabs}


# --- Managers ---

@app.get("/api/managers")
def list_managers(user: dict = Depends(verify_admin_or_manager)):
    result = []
    for username, data in USERS.items():
        if data["role"] == "manager":
            result.append({
                "username": username,
                "full_name": data["full_name"],
                "manager_id": data.get("manager_id"),
            })
    return result


# --- Settings (all tabs) ---

@app.get("/api/settings")
def get_all_settings(user: dict = Depends(verify_admin)):
    users_list = []
    for username, data in USERS.items():
        users_list.append({
            "username": username,
            "role": data["role"],
            "full_name": data["full_name"],
            "tabs": get_user_tabs(username),
        })
    return {
        "users": users_list,
        "available_tabs": [
            {"id": k, "label": v["ru"]} for k, v in TAB_LABELS.items()
        ],
    }


# --- Cabinets ---

@app.get("/api/cabinets", response_model=List[CabinetStatus])
def get_cabinets(user: dict = Depends(verify_credentials)):
    try:
        return get_report_data_service().get_cabinet_statuses()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Reports ---

@app.get("/api/reports", response_model=List[Report])
def get_reports(
    user: dict = Depends(verify_credentials),
    cabinet_number: Optional[str] = None,
    date: Optional[str] = None,
):
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
    try:
        return get_report_data_service().get_report_by_id(report_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/reports", response_model=Report)
def create_report(request: CreateReportRequest, user: dict = Depends(verify_credentials)):
    try:
        return get_report_data_service().create_report(
            cleaner_username=user["username"],
            cabinet_number=request.cabinet_number,
            checklist=request.checklist,
            photos=request.photos or [],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- QR ---

@app.post("/api/qr-link")
def generate_qr_link(request: QRLinkRequest, user: dict = Depends(verify_admin_or_manager)):
    try:
        link = get_report_data_service().generate_qr_link(request.cabinet_number)
        return {"cabinet_number": request.cabinet_number, "link": link}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Stats ---

@app.get("/api/stats")
def get_statistics(user: dict = Depends(verify_admin_or_manager)):
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
        reload=True,
    )
