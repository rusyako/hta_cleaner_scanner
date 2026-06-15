import os
import json
import csv
from io import StringIO
from datetime import datetime
from typing import Any, Dict, List, Optional

import bcrypt
from sqlalchemy.orm import Session

from app.models import Base, engine, User, UserTab, Cabinet, Report

DEFAULT_USERS = [
    {"username": "admin",   "password": "admin",    "role": "admin",   "full_name": "Администратор",  "manager_id": None},
    {"username": "manager", "password": "manager",  "role": "manager", "full_name": "Руководитель",   "manager_id": "mgr_1"},
    {"username": "cleaner", "password": "cleaner",  "role": "cleaner", "full_name": "Клинер",         "manager_id": "mgr_1"},
]

DEFAULT_TABS = {
    "admin":   ["dashboard", "cabinets", "reports", "qr-generator", "managers", "users", "settings"],
    "manager": ["dashboard", "cabinets", "reports", "qr-generator"],
    "cleaner": ["scan", "my-reports"],
}

DEFAULT_CABINETS = [
    "101", "102", "103", "104", "105",
    "201", "202", "203", "204", "205",
    "301", "302", "303", "304", "305",
]


class DatabaseService:

    def __init__(self):
        self._initialized = False

    def init_db(self):
        if self._initialized:
            return
        Base.metadata.create_all(bind=engine)
        db = self._get_session()
        try:
            self._seed_users(db)
            self._seed_cabinets(db)
        finally:
            db.close()
        self._initialized = True

    @staticmethod
    def _get_session():
        from app.database import SessionLocal
        return SessionLocal()

    def _seed_users(self, db: Session):
        for user_data in DEFAULT_USERS:
            existing = db.query(User).filter(User.username == user_data["username"]).first()
            if existing:
                continue
            hashed = bcrypt.hashpw(user_data["password"].encode(), bcrypt.gensalt()).decode()
            user = User(
                username=user_data["username"],
                password_hash=hashed,
                role=user_data["role"],
                full_name=user_data["full_name"],
                manager_id=user_data["manager_id"],
            )
            db.add(user)
            db.flush()
            tabs = DEFAULT_TABS.get(user_data["role"], [])
            for tab_id in tabs:
                db.add(UserTab(user_id=user.id, tab_id=tab_id))
        db.commit()

    def _seed_cabinets(self, db: Session):
        for number in DEFAULT_CABINETS:
            if not db.query(Cabinet).filter(Cabinet.cabinet_number == number).first():
                db.add(Cabinet(cabinet_number=number))
        db.commit()

    # --- Auth ---

    def authenticate(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        db = self._get_session()
        try:
            user = db.query(User).filter(User.username == username).first()
            if not user:
                return None
            if not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
                return None
            tabs = [t.tab_id for t in user.tabs]
            return {
                "username": user.username,
                "role": user.role,
                "full_name": user.full_name,
                "manager_id": user.manager_id,
                "tabs": tabs,
            }
        finally:
            db.close()

    # --- Users ---

    def get_all_users(self) -> List[Dict[str, Any]]:
        db = self._get_session()
        try:
            users = db.query(User).all()
            result = []
            for u in users:
                tabs = [t.tab_id for t in u.tabs]
                result.append({
                    "username": u.username,
                    "role": u.role,
                    "full_name": u.full_name,
                    "manager_id": u.manager_id,
                    "tabs": tabs,
                })
            return result
        finally:
            db.close()

    def create_user(self, username: str, password: str, role: str, full_name: str, manager_id: Optional[str]) -> Dict[str, Any]:
        db = self._get_session()
        try:
            if db.query(User).filter(User.username == username).first():
                raise ValueError("Пользователь уже существует")
            hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
            user = User(
                username=username,
                password_hash=hashed,
                role=role,
                full_name=full_name,
                manager_id=manager_id,
            )
            db.add(user)
            db.flush()
            tabs = DEFAULT_TABS.get(role, [])
            for tab_id in tabs:
                db.add(UserTab(user_id=user.id, tab_id=tab_id))
            db.commit()
            return {
                "username": user.username,
                "role": user.role,
                "full_name": user.full_name,
                "manager_id": user.manager_id,
                "tabs": tabs,
            }
        finally:
            db.close()

    def delete_user(self, username: str, current_username: str):
        if username == "admin":
            raise ValueError("Нельзя удалить администратора")
        if username == current_username:
            raise ValueError("Нельзя удалить самого себя")
        db = self._get_session()
        try:
            user = db.query(User).filter(User.username == username).first()
            if not user:
                raise ValueError("Пользователь не найден")
            db.delete(user)
            db.commit()
        finally:
            db.close()

    def change_password(self, username: str, old_password: str, new_password: str):
        db = self._get_session()
        try:
            user = db.query(User).filter(User.username == username).first()
            if not user:
                raise ValueError("Пользователь не найден")
            if not bcrypt.checkpw(old_password.encode(), user.password_hash.encode()):
                raise ValueError("Неверный текущий пароль")
            user.password_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
            db.commit()
        finally:
            db.close()

    def get_user_tabs(self, username: str) -> Dict[str, Any]:
        db = self._get_session()
        try:
            user = db.query(User).filter(User.username == username).first()
            if not user:
                raise ValueError("Пользователь не найден")
            tabs = [t.tab_id for t in user.tabs]
            return {"username": username, "tabs": tabs, "role": user.role}
        finally:
            db.close()

    def set_user_tabs(self, username: str, tab_ids: List[str]):
        db = self._get_session()
        try:
            user = db.query(User).filter(User.username == username).first()
            if not user:
                raise ValueError("Пользователь не найден")
            db.query(UserTab).filter(UserTab.user_id == user.id).delete()
            for tab_id in tab_ids:
                db.add(UserTab(user_id=user.id, tab_id=tab_id))
            db.commit()
        finally:
            db.close()

    # --- Managers ---

    def get_managers(self) -> List[Dict[str, Any]]:
        db = self._get_session()
        try:
            managers = db.query(User).filter(User.role == "manager").all()
            return [
                {"username": m.username, "full_name": m.full_name, "manager_id": m.manager_id}
                for m in managers
            ]
        finally:
            db.close()

    # --- Settings ---

    def get_settings(self) -> Dict[str, Any]:
        from app.models import UserTab
        users = self.get_all_users()
        return {
            "users": users,
            "available_tabs": [
                {"id": "dashboard",    "label": "Дашборд"},
                {"id": "cabinets",     "label": "Кабинеты"},
                {"id": "reports",      "label": "Отчеты"},
                {"id": "qr-generator", "label": "QR-коды"},
                {"id": "managers",     "label": "Руководители"},
                {"id": "users",        "label": "Пользователи"},
                {"id": "settings",     "label": "Настройки"},
                {"id": "scan",         "label": "Скан"},
                {"id": "my-reports",   "label": "Мои отчеты"},
            ],
        }

    # --- Cabinets ---

    def get_cabinet_statuses(self) -> List[Dict[str, Any]]:
        db = self._get_session()
        try:
            cabinets = db.query(Cabinet).order_by(Cabinet.cabinet_number).all()
            result = []
            for c in cabinets:
                last_report = (
                    db.query(Report)
                    .filter(Report.cabinet_number == c.cabinet_number)
                    .order_by(Report.timestamp.desc())
                    .first()
                )
                if last_report:
                    hours_ago = (datetime.utcnow() - last_report.timestamp).total_seconds() / 3600
                    status = "green" if hours_ago < 12 else "yellow"
                    result.append({
                        "cabinet_number": c.cabinet_number,
                        "status": status,
                        "last_cleaned": last_report.timestamp.isoformat(),
                        "cleaner_name": last_report.cleaner_name or last_report.cleaner_username,
                    })
                else:
                    result.append({
                        "cabinet_number": c.cabinet_number,
                        "status": "yellow",
                        "last_cleaned": None,
                        "cleaner_name": None,
                    })
            return result
        finally:
            db.close()

    # --- Reports ---

    def get_reports(
        self,
        cabinet_number: Optional[str] = None,
        date: Optional[str] = None,
        cleaner_username: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        db = self._get_session()
        try:
            q = db.query(Report).order_by(Report.timestamp.desc())
            if cleaner_username:
                q = q.filter(Report.cleaner_username == cleaner_username)
            if cabinet_number:
                q = q.filter(Report.cabinet_number == cabinet_number)
            if date:
                q = q.filter(Report.timestamp.cast(String).startswith(date))
            reports = q.all()
            return [self._report_to_dict(r) for r in reports]
        finally:
            db.close()

    def get_report_by_id(self, report_id: int) -> Dict[str, Any]:
        db = self._get_session()
        try:
            report = db.query(Report).filter(Report.id == report_id).first()
            if not report:
                raise ValueError(f"Report {report_id} not found")
            return self._report_to_dict(report)
        finally:
            db.close()

    def create_report(self, cleaner_username: str, cabinet_number: str, checklist: str, photos: List[str]) -> Dict[str, Any]:
        db = self._get_session()
        try:
            report = Report(
                cleaner_username=cleaner_username,
                cleaner_name=cleaner_username,
                cabinet_number=cabinet_number.strip(),
                checklist=checklist.strip(),
                photos=json.dumps(photos),
                timestamp=datetime.utcnow(),
            )
            db.add(report)
            db.commit()
            db.refresh(report)
            return self._report_to_dict(report)
        finally:
            db.close()

    def update_report(self, report_id: int, checklist: Optional[str], photos: Optional[List[str]]) -> Dict[str, Any]:
        db = self._get_session()
        try:
            report = db.query(Report).filter(Report.id == report_id).first()
            if not report:
                raise ValueError("Отчет не найден")
            if checklist is not None:
                report.checklist = checklist.strip()
            if photos is not None:
                report.photos = json.dumps(photos)
            db.commit()
            db.refresh(report)
            return self._report_to_dict(report)
        finally:
            db.close()

    def delete_report(self, report_id: int):
        db = self._get_session()
        try:
            report = db.query(Report).filter(Report.id == report_id).first()
            if not report:
                raise ValueError("Отчет не найден")
            db.delete(report)
            db.commit()
        finally:
            db.close()

    def get_statistics(self) -> Dict[str, Any]:
        db = self._get_session()
        try:
            total_reports = db.query(Report).count()
            today_str = datetime.utcnow().strftime("%Y-%m-%d")
            cleanings_today = db.query(Report).filter(
                Report.timestamp.cast(String).startswith(today_str)
            ).count()
            total_cabinets = db.query(Cabinet).count()
            return {
                "total_reports": total_reports,
                "cleanings_today": cleanings_today,
                "total_cabinets": total_cabinets,
            }
        finally:
            db.close()

    def generate_qr_link(self, cabinet_number: str) -> str:
        from urllib.parse import urlencode
        app_url = os.getenv("FRONTEND_APP_URL", "https://localhost:2000").rstrip("/")
        query = urlencode({"cabinet": cabinet_number.strip()})
        return f"{app_url}/scan?{query}"

    def export_reports_csv(self) -> str:
        db = self._get_session()
        try:
            reports = db.query(Report).order_by(Report.timestamp.desc()).all()
            output = StringIO()
            writer = csv.writer(output)
            writer.writerow(["ID", "Дата", "Клинер", "Кабинет", "Чек-лист", "Фото (кол-во)"])
            for r in reports:
                try:
                    photos_list = json.loads(r.photos) if r.photos else []
                except (json.JSONDecodeError, TypeError):
                    photos_list = []
                writer.writerow([r.id, r.timestamp.isoformat(), r.cleaner_name, r.cabinet_number, r.checklist, len(photos_list)])
            return output.getvalue()
        finally:
            db.close()

    @staticmethod
    def _report_to_dict(report: Report) -> Dict[str, Any]:
        try:
            photos_list = json.loads(report.photos) if report.photos else []
        except (json.JSONDecodeError, TypeError):
            photos_list = []
        return {
            "id": report.id,
            "timestamp": report.timestamp.isoformat(),
            "role": "Клинер",
            "cabinet_number": report.cabinet_number,
            "checklist": report.checklist,
            "photos": photos_list,
        }
