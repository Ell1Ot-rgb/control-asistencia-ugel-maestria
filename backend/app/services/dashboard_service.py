"""TEC-D10 — dashboard indicators."""
from __future__ import annotations

from typing import Any


class DashboardService:
    def indicators(self, month: int, year: int) -> dict[str, Any]:
        return {
            "total_archivos_cargados": 0,
            "total_empleados_activos": 0,
            "periodo": {"mes": month, "anio": year},
            "distribucion_marcaciones": {
                "asistencia": 0,
                "tardanza": 0,
                "inasistencia": 0,
                "justificado": 0,
                "licencia": 0,
                "permiso": 0,
            },
            "ultimas_cargas": [],
        }


dashboard_service = DashboardService()
