-- Demo seed idempotente (TEC-D02 / TEC-D12). Password demo: Demo12345
-- Bcrypt hash generated for the academic demo user; replace only in real environments.

SET ECHO OFF
SET VERIFY OFF
SET FEEDBACK ON
SET SERVEROUTPUT ON

WHENEVER SQLERROR EXIT SQL.SQLCODE

PROMPT ============================================
PROMPT [4/5] INSERTANDO / ACTUALIZANDO DATOS DEMO
PROMPT ============================================

DECLARE
BEGIN
    MERGE INTO institution target
    USING (
        SELECT
            'UGEL Demo' AS ugel,
            'IE Demo CHIQUISTRUKIS' AS school_name,
            '1234567' AS modular_code,
            'Secundaria' AS education_level,
            'Mañana' AS shift_name,
            'Y' AS is_active
        FROM dual
    ) source
    ON (target.modular_code = source.modular_code)
    WHEN MATCHED THEN UPDATE SET
        target.ugel = source.ugel,
        target.school_name = source.school_name,
        target.education_level = source.education_level,
        target.shift_name = source.shift_name,
        target.is_active = source.is_active
    WHEN NOT MATCHED THEN INSERT (
        ugel, school_name, modular_code, education_level, shift_name, is_active
    ) VALUES (
        source.ugel, source.school_name, source.modular_code,
        source.education_level, source.shift_name, source.is_active
    );
    DBMS_OUTPUT.PUT_LINE('[MERGE] Institucion demo verificada');

    MERGE INTO user_account target
    USING (
        SELECT
            'director.demo' AS username,
            '$2b$12$UlE82zEvVTdObeimppfnQ.IVoZxVA0wyLqlMHp0z7OCZCY8sEgZAW' AS password_hash,
            'Director' AS role_name,
            'Y' AS is_active
        FROM dual
    ) source
    ON (target.username = source.username)
    WHEN MATCHED THEN UPDATE SET
        target.password_hash = source.password_hash,
        target.role_name = source.role_name,
        target.is_active = source.is_active
    WHEN NOT MATCHED THEN INSERT (
        username, password_hash, role_name, is_active
    ) VALUES (
        source.username, source.password_hash, source.role_name, source.is_active
    );
    DBMS_OUTPUT.PUT_LINE('[MERGE] Usuario demo director.demo verificado');

    MERGE INTO staff_member target
    USING (
        SELECT '45678912' AS dni, 'Quispe Mamani' AS last_names, 'Maria Elena' AS first_names,
               'Docente' AS job_title, 'Nombrado' AS employment_status, 'Y' AS is_active FROM dual
        UNION ALL
        SELECT '71234567', 'Huaman Rojas', 'Carlos Alberto',
               'Docente', 'Contratado', 'Y' FROM dual
        UNION ALL
        SELECT '40112233', 'Flores Ilacopa', 'Leida Idalecia',
               'Auxiliar', 'Nombrado', 'Y' FROM dual
    ) source
    ON (target.dni = source.dni)
    WHEN MATCHED THEN UPDATE SET
        target.last_names = source.last_names,
        target.first_names = source.first_names,
        target.job_title = source.job_title,
        target.employment_status = source.employment_status,
        target.is_active = source.is_active
    WHEN NOT MATCHED THEN INSERT (
        dni, last_names, first_names, job_title, employment_status, is_active
    ) VALUES (
        source.dni, source.last_names, source.first_names,
        source.job_title, source.employment_status, source.is_active
    );
    DBMS_OUTPUT.PUT_LINE('[MERGE] Personal demo verificado');

    INSERT INTO staff_institution (staff_member_id, institution_id, start_date, is_active)
    SELECT s.id, i.id, DATE '2025-03-01', 'Y'
    FROM staff_member s CROSS JOIN institution i
    WHERE i.modular_code = '1234567'
      AND NOT EXISTS (
          SELECT 1
          FROM staff_institution existing
          WHERE existing.staff_member_id = s.id
            AND existing.institution_id = i.id
            AND existing.start_date = DATE '2025-03-01'
      );
    DBMS_OUTPUT.PUT_LINE('[INSERT] Relaciones staff_institution faltantes: ' || SQL%ROWCOUNT);

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('[OK] Seed demo confirmado sin duplicados');
END;
/

PROMPT ============================================
PROMPT [OK] DATOS DEMO VALIDADOS
PROMPT ============================================

EXIT SUCCESS
