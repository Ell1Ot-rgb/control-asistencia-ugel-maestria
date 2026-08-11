"""TEC-D09 + TEC-D12 — annex reports using institution header + attendance_day."""

from __future__ import annotations

from collections import Counter, defaultdict
from typing import Any

from app.services.attendance_service import attendance_service
from app.services.staff_member_service import (
    StaffMemberNotFoundError,
    staff_member_service,
)

DEMO_INSTITUTION = {
    "ugel": "UGEL Demo",
    "school_name": "IE Demo CHIQUISTRUKIS",
    "modular_code": "1234567",
    "education_level": "Secundaria",
    "shift_name": "Mañana",
}


class ReportService:
    def annex_03(
        self, month: int, year: int, institution: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        inst = institution or DEMO_INSTITUTION
        attendance_rows = attendance_service.list_month(month, year)
        rows_by_staff: dict[int, list[dict[str, Any]]] = defaultdict(list)
        for row in attendance_rows:
            rows_by_staff[row["staff_member_id"]].append(row)

        rows = []
        active_staff = staff_member_service.list(is_active="Y")
        for staff_member in active_staff:
            staff_member_id = staff_member["id"]
            days = rows_by_staff.get(staff_member_id, [])
            rows.append(
                {
                    "staff_member_id": staff_member_id,
                    "dni": staff_member.get("dni"),
                    "full_name": self._full_name(staff_member),
                    "days": sorted(days, key=lambda day: day["attendance_date"]),
                }
            )

        return {
            "institution": inst,
            "period": {"month": month, "year": year},
            "source": "attendance_day",
            "rows": rows,
        }

    def annex_04(self, month: int, year: int) -> dict[str, Any]:
        active_staff = staff_member_service.list(is_active="Y")
        attendance_rows = attendance_service.list_month(month, year)
        totals = Counter(row["status"] for row in attendance_rows)

        rows_by_staff: dict[int, list[dict[str, Any]]] = defaultdict(list)
        for row in attendance_rows:
            rows_by_staff[row["staff_member_id"]].append(row)

        detail_rows = []
        for staff_member in active_staff:
            staff_member_id = staff_member["id"]
            days = rows_by_staff.get(staff_member_id, [])
            summary = Counter(day["status"] for day in days)
            detail_rows.append(
                {
                    "staff_member_id": staff_member_id,
                    "dni": staff_member.get("dni"),
                    "full_name": self._full_name(staff_member),
                    "job_title": staff_member.get("job_title"),
                    "employment_status": staff_member.get("employment_status"),
                    "summary": {
                        "present": summary["present"],
                        "late": summary["late"],
                        "absent": summary["absent"],
                        "justified": summary["justified"],
                        "leave": summary["leave"],
                        "permission": summary["permission"],
                    },
                }
            )

        return {
            "institution": DEMO_INSTITUTION,
            "period": {"month": month, "year": year},
            "source": "attendance_day",
            "staff_count": len(active_staff),
            "totals": {
                "present": totals["present"],
                "late": totals["late"],
                "absent": totals["absent"],
                "justified": totals["justified"],
                "leave": totals["leave"],
                "permission": totals["permission"],
            },
            "rows": detail_rows,
        }

    def _staff_member(self, staff_member_id: int) -> dict[str, Any]:
        try:
            return staff_member_service.get(staff_member_id)
        except StaffMemberNotFoundError:
            return {
                "dni": None,
                "last_names": "Unknown",
                "first_names": "Staff",
            }

    def _full_name(self, staff_member: dict[str, Any]) -> str:
        return f"{staff_member['last_names']}, {staff_member['first_names']}"

    def export_official_excel(self, month: int, year: int) -> bytes:
        import calendar
        import io
        import openpyxl
        from openpyxl.styles import Alignment, Border, Font, PatternFill, Side

        wb = openpyxl.Workbook()

        # --- SHEET 1: ANEXO 03 ---
        ws1 = wb.active
        ws1.title = "Anexo 03 - Asistencia"

        ws1.cell(row=1, column=1, value="NORMAS PARA EL REGISTRO Y CONTROL DE ASISTENCIA Y SU APLICACIÓN EN LA PLANILLA ÚNICA DE PAGOS DE LOS PROFESORES Y AUXILIARES DE EDUCACIÓN (R.S.G. N° 326-2017-MINEDU)")
        ws1.cell(row=1, column=1).font = Font(name="Calibri", size=9, bold=True, color="1E3A8A")

        ws1.cell(row=3, column=1, value="ANEXO 03")
        ws1.cell(row=3, column=1).font = Font(name="Calibri", size=14, bold=True, color="1E40AF")

        ws1.cell(row=4, column=1, value="FORMATO 01: REPORTE DE ASISTENCIA DETALLADO")
        ws1.cell(row=4, column=1).font = Font(name="Calibri", size=11, bold=True)

        ws1.cell(row=5, column=1, value=f"UGEL: SAN ROMÁN | MES: {month} | AÑO: {year} | TURNO: Mañana")
        ws1.cell(row=6, column=1, value=f"INSTITUCIÓN EDUCATIVA: {DEMO_INSTITUTION['school_name']} | CÓDIGO MODULAR: {DEMO_INSTITUTION['modular_code']}")
        ws1.cell(row=7, column=1, value=f"NIVEL EDUCATIVO Y MODALIDAD: {DEMO_INSTITUTION['education_level']} | DEP: PUNO | PROV: SAN ROMÁN")

        headers = ["N°", "DNI", "APELLIDOS Y NOMBRES", "CARGO", "CONDICION LABORAL", "JORNADA"]
        num_days = calendar.monthrange(year, month)[1]
        for day in range(1, 32):
            headers.append(str(day) if day <= num_days else "-")
        headers.extend(["Tardanzas (m)", "Inasistencias", "Justificadas", "OBSERVACIONES"])

        ws1.append([])
        ws1.append(headers)

        header_fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
        header_font = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
        thin_border = Border(
            left=Side(style="thin", color="CBD5E1"),
            right=Side(style="thin", color="CBD5E1"),
            top=Side(style="thin", color="CBD5E1"),
            bottom=Side(style="thin", color="CBD5E1"),
        )

        for col_idx in range(1, len(headers) + 1):
            cell = ws1.cell(row=9, column=col_idx)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")
            cell.border = thin_border

        anex_03_data = self.annex_03(month, year)
        active_staff = anex_03_data["rows"]

        for idx, staff in enumerate(active_staff, start=1):
            day_map = {d["attendance_date"][-2:]: d["status"] for d in staff.get("days", [])}
            late_mins_map = {d["attendance_date"][-2:]: d.get("late_minutes", 0) for d in staff.get("days", [])}

            row_vals = [idx, staff.get("dni") or "", staff.get("full_name") or "", "Docente", "Nombrado", "30 hrs"]

            total_late_m = 0
            total_absent = 0
            total_just = 0

            for d in range(1, 32):
                if d <= num_days:
                    d_str = f"{d:02d}"
                    st = day_map.get(d_str)
                    if st == "late":
                        code = "T"
                        total_late_m += late_mins_map.get(d_str, 15)
                    elif st == "present":
                        code = "A"
                    elif st in {"justified", "leave", "permission"}:
                        code = "J"
                        total_just += 1
                    elif st == "absent":
                        code = "I"
                        total_absent += 1
                    else:
                        code = "-"
                    row_vals.append(code)
                else:
                    row_vals.append("-")

            row_vals.extend([total_late_m, total_absent, total_just, "Conforme RSG 326"])
            ws1.append(row_vals)

            row_idx = 9 + idx
            for col_idx in range(1, len(row_vals) + 1):
                c = ws1.cell(row=row_idx, column=col_idx)
                c.border = thin_border
                c.alignment = Alignment(horizontal="center" if col_idx != 3 else "left", vertical="center")

                val = str(c.value)
                if val == "A":
                    c.fill = PatternFill(start_color="DCFCE7", end_color="DCFCE7", fill_type="solid")
                    c.font = Font(color="15803D", bold=True)
                elif val == "T":
                    c.fill = PatternFill(start_color="FEF9C3", end_color="FEF9C3", fill_type="solid")
                    c.font = Font(color="A16207", bold=True)
                elif val == "J":
                    c.fill = PatternFill(start_color="DBEAFE", end_color="DBEAFE", fill_type="solid")
                    c.font = Font(color="1D4ED8", bold=True)
                elif val == "I":
                    c.fill = PatternFill(start_color="FEE2E2", end_color="FEE2E2", fill_type="solid")
                    c.font = Font(color="B91C1C", bold=True)

        # --- SHEET 2: ANEXO 04 ---
        ws2 = wb.create_sheet(title="Anexo 04 - Consolidado UGEL")
        ws2.cell(row=1, column=1, value="ANEXO 04: CONSOLIDADO DE ASISTENCIA Y DESCUENTOS PARA LA PLANILLA DE PAGOS - UGEL SAN ROMÁN")
        ws2.cell(row=1, column=1).font = Font(name="Calibri", size=12, bold=True, color="1E3A8A")
        ws2.cell(row=2, column=1, value=f"PERÍODO: MES {month} / AÑO {year}")

        headers_04 = ["N°", "DNI", "APELLIDOS Y NOMBRES", "CARGO", "CONDICIÓN", "PUNTUALES", "TARDANZAS (Días)", "TOTAL MINUTOS TARDANZA", "INASISTENCIAS (Días)", "DESCUENTO SUGERIDO (Días)"]
        ws2.append([])
        ws2.append(headers_04)

        for col_idx in range(1, len(headers_04) + 1):
            cell = ws2.cell(row=4, column=col_idx)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")
            cell.border = thin_border

        anex_04_data = self.annex_04(month, year)
        for idx, staff in enumerate(anex_04_data.get("rows", []), start=1):
            sum_data = staff.get("summary", {})
            lates = sum_data.get("late", 0)
            absents = sum_data.get("absent", 0)
            mins = lates * 15
            suggested_disc = absents + (mins // 60)

            r_vals = [
                idx,
                staff.get("dni"),
                staff.get("full_name"),
                staff.get("job_title") or "Docente",
                staff.get("employment_status") or "Nombrado",
                sum_data.get("present", 0),
                lates,
                mins,
                absents,
                suggested_disc,
            ]
            ws2.append(r_vals)

            r_idx = 4 + idx
            for col_idx in range(1, len(r_vals) + 1):
                c = ws2.cell(row=r_idx, column=col_idx)
                c.border = thin_border
                c.alignment = Alignment(horizontal="center" if col_idx != 3 else "left", vertical="center")

        buffer = io.BytesIO()
        wb.save(buffer)
        return buffer.getvalue()


report_service = ReportService()
