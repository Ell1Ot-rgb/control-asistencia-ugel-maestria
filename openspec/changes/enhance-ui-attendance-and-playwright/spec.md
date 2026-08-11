# Updated Specification: Biometric File Processing (CSV/DAT) & Official UGEL Excel Report Generation

## Change ID
`enhance-ui-attendance-and-playwright`

---

## 1. Biometric Import & Processing

### REQ-BIOM-01: Support for `.dat` Biometric Formats
- **Given** a raw `.dat` file extracted from a biometric clock (e.g., ZKTeco / Anviz `attlog.dat`).
- **When** uploaded to the system.
- **Then** detect format automatically:
  - **Format A (Standard CSV)**: Comma/tab-separated with headers (`dni,marked_at,mark_type`).
  - **Format B (ZKTeco ATTLOG)**: Positional/tab-separated without headers (`[USER_ID] [YYYY-MM-DD HH:MM:SS] [IN/OUT] [...]`).
  - Rows marked as `entry` (IN=1) or `exit` (OUT=0).

## 2. User Interface & Grid Display (Anexo 03 / Anexo 04)

### REQ-UI-01: Official RSG N.° 326 Status Badges
- Render letters in circular colored badges:
  - `A` (Puntual): Green badge (`#15803d` / bg `#dcfce7`).
  - `T` (Tardanza): Yellow badge (`#a16207` / bg `#fef9c3`).
  - `J` (Justificada): Blue badge (`#1d4ed8` / bg `#dbeafe`).
  - `I` (Inasistencia): Red badge (`#b91c1c` / bg `#fee2e2`).

### REQ-UI-02: Granular Time & Minute Tooltips
- When hovering over a badge: display exact times (e.g. `08:15 AM (+15m)` / `13:00 PM`).

### REQ-UI-03: Editable Anexo 03 Precursor Grid & Row Redirection
- Anexo 03 grid cells MUST be editable before export to allow director adjustments. Clicking staff names redirects to `/justificaciones?staff_id={id}`.

## 3. Official UGEL Excel Report Generation (`.xlsx`)

### REQ-EXCEL-01: Exact Format Matching (`PLANTILLA-INFORME-ASIST`)
- Generate `.xlsx` file with identical visual layout, typography, merged cells, and official headers from `PLANTILLA-INFORME-ASIST-INICIAL-2021.csv`:
  - Title: *"NORMAS PARA EL REGISTRO Y CONTROL DE ASISTENCIA ... R.S.G. N° 326-2017-MINEDU"*
  - Metadata header: UGEL, IE Name, Código Modular, Nivel/Modalidad, LUGAR, DEP, PROV, DIS, AÑO, MES, TURNO.
  - Grid columns: N°, DNI, APELLIDOS Y NOMBRES, CARGO, CONDICION LABORAL, JORNADA LABORAL, DIAS CALENDARIO (1-31 with Mon/Tue/Wed/Thu/Fri/Sat/Sun), Inasistencia+LSGH, OBSERVACIONES, Legend footers.

### REQ-EXCEL-02: Single Workbook with Multi-Sheet Architecture
- **Hoja 1 ("Anexo 03")**: Detailed daily attendance grid.
- **Hoja 2 ("Anexo 04")**: Consolidated discounts and summary table.

## 4. Integrated Playwright E2E Command

### REQ-E2E-01: Official Playwright Run
- Running `npm run test:e2e` executes headless browser tests verifying login, navigation, CSV/DAT import, justification creation, and excel report download generation.

## Acceptance Criteria
- [ ] `.dat` files (CSV text or ZKTeco ATTLOG text) parse and process correctly in `/carga`.
- [ ] Anexo 03 grid renders official badges with interactive tooltips, and cells are editable.
- [ ] Clicking row names redirects to justifications module pre-filled.
- [ ] Downloading reports provides a single `.xlsx` file with Sheet 1 as Anexo 03 and Sheet 2 as Anexo 04 matching official format.
- [ ] `npm run test:e2e` executes cleanly with 0 errors in Codespace.
