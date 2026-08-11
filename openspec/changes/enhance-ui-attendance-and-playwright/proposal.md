# Proposal: Enhance UI Attendance Badges, Navigation Redirection, and Playwright E2E Integration

## Change ID
`enhance-ui-attendance-and-playwright`

## Executive Summary
This proposal aims to upgrade the user experience of the UGEL attendance system (`control-asistencia-ugel-maestria`) by implementing official RSG N.° 326-2017-MINEDU color-coded status badges (`T`, `A`, `J`, `I`), enriching attendance detail views with exact timestamps and late minute calculations (e.g. `08:15 AM (+15 min)`), enabling seamless row-click navigation from reports/attendance to the justifications module, and establishing an official Playwright E2E test suite integrated into `npm run test:e2e`.

## Problem Statement
1. **Unfriendly Status Rendering**: Currently, Anexo 03 renders raw text strings like `01:late | 02:late`, which looks cluttered and hard to scan visually for school directors.
2. **Missing Granular Time Detail**: Directors cannot see the exact arrival time or minute breakdown directly on the consolidated grid.
3. **Disjointed Navigation**: Clicking on a staff member in Anexo 03 or Anexo 04 does not take the user to their respective justification or detail page.
4. **Ad-hoc Playwright Scripts**: E2E test scripts currently live in separate `.mjs` files instead of an integrated `npm run test:e2e` suite inside `frontend/e2e/`.

## Proposed Solution
1. **Official RSG N.° 326 Status Badges**:
   - `A` (Verde - Puntual / Asistencia)
   - `T` (Amarillo - Tardanza con minutos de exceso)
   - `J` (Azul - Licencia / Justificada)
   - `I` (Rojo - Inasistencia injustificada)
2. **Detailed Timestamp Displays**:
   - Format: `08:15 AM (+15m)` for tardanzas; hover/tooltip showing exact entry and exit times.
3. **Seamless Row Navigation**:
   - Clicking a staff row in Anexo 03 / Anexo 04 redirects to `/justificaciones?staff_id={id}`, pre-selecting that staff member in the dropdown.
4. **Integrated Playwright E2E Suite**:
   - Structure `frontend/e2e/` with automated specs for Login, Staff Management, Biometric Import, Annex 03/04 Grid, Justifications, and Responsive Navigation. Add `"test:e2e": "node test_responsive_nav.mjs"` to `package.json`.

## Scope & Non-Goals
- **In Scope**: `frontend/src/App.tsx`, `frontend/src/styles.css`, `frontend/package.json`, `frontend/e2e/`.
- **Non-Goals**: No changes to backend database models; Oracle DB remain deferred per Sprint 1 MVP policy.

## Risks & Mitigation
- **Risk**: Dense grid layout overflow on small screens.
- **Mitigation**: Flexible flex-wrap container and responsive badge tooltips.
