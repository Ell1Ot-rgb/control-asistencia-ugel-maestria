# Specification: Enhance UI Attendance Badges, Navigation Redirection, and Playwright E2E Integration

## Change ID
`enhance-ui-attendance-and-playwright`

## Requirement Definitions

### REQ-UI-01: Official RSG N.° 326 Status Badges
- **Given** a staff member's daily attendance record in Anexo 03.
- **When** rendered in the grid.
- **Then** display styled badges:
  - `A` (Green `#15803d` on `#dcfce7`) for Present/Puntual.
  - `T` (Yellow `#a16207` on `#fef9c3`) for Late/Tardanza.
  - `J` (Blue `#1d4ed8` on `#dbeafe`) for Justified/Licencia.
  - `I` (Red `#b91c1c` on `#fee2e2`) for Absent/Inasistencia.

### REQ-UI-02: Granular Time & Minute Tooltips
- **Given** a late attendance entry.
- **When** hovering or viewing the day pill.
- **Then** display the exact arrival time and minutes late (e.g. `08:15 (+15m)`).

### REQ-UI-03: Row Redirection to Justifications
- **Given** a staff row in Anexo 03 or Anexo 04.
- **When** clicked by the user.
- **Then** navigate to `/justificaciones?staff_id={id}` and automatically pre-select that staff member in the form dropdown.

### REQ-E2E-01: Integrated Playwright Command
- **Given** the frontend repository.
- **When** running `npm run test:e2e`.
- **Then** execute Playwright headless browser tests verifying login, navigation, CSV import, justification creation, and report rendering.

## Acceptance Criteria
- [x] Anexo 03 grid renders colored status badges instead of plain text strings.
- [x] Clicking any staff row in Anexo 03/04 redirects to `/justificaciones` with pre-selected staff ID.
- [x] `npm run test:e2e` executes cleanly with 0 errors in Codespace.
