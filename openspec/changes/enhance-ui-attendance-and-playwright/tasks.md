# Tasks: Enhance UI Attendance Badges, Navigation Redirection, .dat Support, and Official Excel Exporter

## Change ID
`enhance-ui-attendance-and-playwright`

## Task Breakdown

### Task 1: Backend - Add `.dat` Biometric File Parser Support
- [ ] Implement `_parse_dat()` parser in `backend/app/services/biometric_import_service.py` to handle positional/tab-delimited `attlog.dat` records from ZKTeco/Anviz clocks.
- [ ] Update `biometric_imports.py` router to accept `.dat` and `.csv` extensions.
- [ ] Add unit test for `.dat` parsing.

### Task 2: Backend - Official OpenPyXL Excel Generator (`Anexo 03` + `Anexo 04`)
- [ ] Add `openpyxl` dependency to `backend/requirements.txt`.
- [ ] Implement `export_official_excel()` in `backend/app/services/report_service.py` matching the exact layout of `PLANTILLA-INFORME-ASIST-INICIAL-2021.csv`.
- [ ] Generate Sheet 1 ("Anexo 03") with daily grid, RSG N.° 326 codes, headers, and footer legend.
- [ ] Generate Sheet 2 ("Anexo 04") with consolidated discounts.
- [ ] Add endpoint `GET /api/v1/reports/official-excel?month={m}&year={y}` returning `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.

### Task 3: Frontend - UI RSG N.° 326 Badges, Editing & Row Navigation
- [ ] Update `AttendancePage` / `ReportsPage` in `frontend/src/App.tsx` to render circular status badges (`A`, `T`, `J`, `I`) with hover tooltips displaying arrival time and minute excess (e.g. `08:15 AM (+15m)`).
- [ ] Add row-click navigation from staff rows to `/justificaciones?staff_id={id}`.
- [ ] Add **"Exportar Excel Oficial (.xlsx)"** button triggering direct download of the official 2-sheet workbook.

### Task 4: E2E - Integrated Playwright Suite
- [ ] Update `frontend/package.json` with `"test:e2e": "node test_responsive_nav.mjs && node test_agosto_import.mjs"`.
- [ ] Add E2E verification test for Excel download and `.dat` import.

## Review Workload Forecast
- Estimated changed files: ~4 files
- Estimated lines changed: ~250 lines
- Chained PRs recommended: No (within 400-line budget limit)
