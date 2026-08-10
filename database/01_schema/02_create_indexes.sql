CREATE INDEX ix_staff_institution_staff ON staff_institution (staff_member_id);
CREATE INDEX ix_staff_institution_inst  ON staff_institution (institution_id);
CREATE INDEX ix_biometric_import_status ON biometric_import (status, period_start);
CREATE INDEX ix_biometric_mark_import   ON biometric_mark (biometric_import_id);
CREATE INDEX ix_biometric_mark_staff    ON biometric_mark (staff_member_id, marked_at);
CREATE INDEX ix_inconsistency_status    ON inconsistency (status);
CREATE INDEX ix_justification_staff     ON justification (staff_member_id, status);
CREATE INDEX ix_attendance_day_date     ON attendance_day (attendance_date);
CREATE INDEX ix_audit_log_entity        ON audit_log (entity_name, entity_id);
