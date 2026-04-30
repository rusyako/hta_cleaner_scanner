import os
from datetime import datetime, timedelta
from urllib.parse import urlencode
from typing import Any, Dict, List, Optional


def _iso_timestamp(hours_ago: int) -> str:
    return (datetime.now() - timedelta(hours=hours_ago)).replace(microsecond=0).isoformat()


MOCK_REPORTS: List[Dict[str, Any]] = [
    {
        "id": 1,
        "timestamp": _iso_timestamp(1),
        "role": "Клинер",
        "cleaner_username": "cleaner",
        "cleaner_name": "Клинер",
        "cabinet_number": "101",
        "checklist": "Полы, Пыль, Санузел, Зеркала",
        "photos": [
            "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1200&q=80",
        ],
    },
    {
        "id": 2,
        "timestamp": _iso_timestamp(3),
        "role": "Клинер",
        "cleaner_username": "cleaner",
        "cleaner_name": "Клинер",
        "cabinet_number": "102",
        "checklist": "Полы, Мебель, Окна",
        "photos": [
            "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80",
        ],
    },
    {
        "id": 3,
        "timestamp": _iso_timestamp(14),
        "role": "Клинер",
        "cleaner_username": "cleaner",
        "cleaner_name": "Клинер",
        "cabinet_number": "103",
        "checklist": "Полы, Санузел",
        "photos": [],
    },
    {
        "id": 4,
        "timestamp": _iso_timestamp(20),
        "role": "Клинер",
        "cleaner_username": "cleaner",
        "cleaner_name": "Клинер",
        "cabinet_number": "104",
        "checklist": "Полы, Пыль, Расходники",
        "photos": [
            "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=1200&q=80",
        ],
    },
    {
        "id": 5,
        "timestamp": _iso_timestamp(5),
        "role": "Клинер",
        "cleaner_username": "cleaner",
        "cleaner_name": "Клинер",
        "cabinet_number": "201",
        "checklist": "Полы, Пыль, Поверхности, Мусор",
        "photos": [
            "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
        ],
    },
    {
        "id": 6,
        "timestamp": _iso_timestamp(9),
        "role": "Клинер",
        "cleaner_username": "cleaner",
        "cleaner_name": "Клинер",
        "cabinet_number": "202",
        "checklist": "Полы, Столы, Ручки дверей",
        "photos": [],
    },
]


class ReportDataService:
    """Локальный сервис данных для отчетов и кабинетов."""

    def get_cabinet_statuses(self) -> List[Dict[str, Any]]:
        reports = self.get_reports()
        latest_reports: Dict[str, Dict[str, Any]] = {}

        for report in reports:
            existing_report = latest_reports.get(report["cabinet_number"])
            if existing_report is None or report["timestamp"] > existing_report["timestamp"]:
                latest_reports[report["cabinet_number"]] = report

        cabinets: List[Dict[str, Any]] = []
        now = datetime.now()

        for cabinet_number, report in sorted(latest_reports.items()):
            last_cleaned = datetime.fromisoformat(report["timestamp"])
            hours_since_cleaning = (now - last_cleaned).total_seconds() / 3600

            cabinets.append(
                {
                    "cabinet_number": cabinet_number,
                    "status": "green" if hours_since_cleaning < 12 else "yellow",
                    "last_cleaned": report["timestamp"],
                    "cleaner_name": report.get("cleaner_name", report.get("cleaner_username", "Клинер")),
                }
            )

        return cabinets

    def get_reports(
        self,
        cabinet_number: Optional[str] = None,
        date: Optional[str] = None,
        cleaner_username: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        reports = sorted(MOCK_REPORTS, key=lambda report: report["timestamp"], reverse=True)

        if cleaner_username:
            reports = [report for report in reports if report.get("cleaner_username") == cleaner_username]

        if cabinet_number:
            reports = [report for report in reports if report["cabinet_number"] == cabinet_number]

        if date:
            reports = [report for report in reports if report["timestamp"].startswith(date)]

        return reports

    def get_report_by_id(self, report_id: int) -> Dict[str, Any]:
        reports = self.get_reports()
        for report in reports:
            if report["id"] == report_id:
                return report

        raise ValueError(f"Report with id {report_id} not found")

    def generate_qr_link(self, cabinet_number: str) -> str:
        sanitized_number = cabinet_number.strip()
        app_url = os.getenv("FRONTEND_APP_URL", "https://localhost:2000").rstrip("/")
        query = urlencode({"cabinet": sanitized_number})
        return f"{app_url}/scan?{query}"

    def create_report(self, cleaner_username: str, cabinet_number: str, checklist: str, photos: List[str]) -> Dict[str, Any]:
        new_report = {
            "id": max((report["id"] for report in MOCK_REPORTS), default=0) + 1,
            "timestamp": datetime.now().replace(microsecond=0).isoformat(),
            "role": "Клинер",
            "cleaner_username": cleaner_username,
            "cleaner_name": cleaner_username,
            "cabinet_number": cabinet_number.strip(),
            "checklist": checklist.strip(),
            "photos": photos,
        }
        MOCK_REPORTS.insert(0, new_report)
        return new_report

    def get_statistics(self) -> Dict[str, Any]:
        reports = self.get_reports()
        today = datetime.now().strftime("%Y-%m-%d")

        cleanings_today = sum(
            1 for report in reports if report["timestamp"].startswith(today) and report["role"].lower() == "клинер"
        )
        total_cabinets = len({report["cabinet_number"] for report in reports if report["cabinet_number"]})

        return {
            "total_reports": len(reports),
            "cleanings_today": cleanings_today,
            "total_cabinets": total_cabinets,
        }
