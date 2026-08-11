SET ECHO OFF
SET VERIFY OFF
SET FEEDBACK ON
SET SERVEROUTPUT ON

WHENEVER SQLERROR EXIT SQL.SQLCODE

PROMPT ============================================
PROMPT VALIDACION DE BASE DE DATOS - CHIQUISTRUKIS
PROMPT ============================================

DECLARE
    v_count NUMBER;
    v_errors NUMBER := 0;

    PROCEDURE check_count(
        p_label IN VARCHAR2,
        p_sql IN VARCHAR2,
        p_expected IN NUMBER DEFAULT 1
    ) IS
    BEGIN
        EXECUTE IMMEDIATE p_sql INTO v_count;

        IF v_count = p_expected THEN
            DBMS_OUTPUT.PUT_LINE('[OK] ' || p_label);
        ELSE
            v_errors := v_errors + 1;
            DBMS_OUTPUT.PUT_LINE(
                '[ERROR] ' || p_label || ' esperado=' || p_expected || ' actual=' || v_count
            );
        END IF;
    END;
BEGIN
    DBMS_OUTPUT.PUT_LINE('Usuario actual: ' || USER);

    check_count('Tabla USER_ACCOUNT existe',
        q'[SELECT COUNT(*) FROM user_tables WHERE table_name = 'USER_ACCOUNT']');
    check_count('Tabla INSTITUTION existe',
        q'[SELECT COUNT(*) FROM user_tables WHERE table_name = 'INSTITUTION']');
    check_count('Tabla STAFF_MEMBER existe',
        q'[SELECT COUNT(*) FROM user_tables WHERE table_name = 'STAFF_MEMBER']');
    check_count('Tabla STAFF_INSTITUTION existe',
        q'[SELECT COUNT(*) FROM user_tables WHERE table_name = 'STAFF_INSTITUTION']');
    check_count('Tabla BIOMETRIC_IMPORT existe',
        q'[SELECT COUNT(*) FROM user_tables WHERE table_name = 'BIOMETRIC_IMPORT']');
    check_count('Tabla BIOMETRIC_MARK existe',
        q'[SELECT COUNT(*) FROM user_tables WHERE table_name = 'BIOMETRIC_MARK']');
    check_count('Tabla INCONSISTENCY existe',
        q'[SELECT COUNT(*) FROM user_tables WHERE table_name = 'INCONSISTENCY']');
    check_count('Tabla JUSTIFICATION existe',
        q'[SELECT COUNT(*) FROM user_tables WHERE table_name = 'JUSTIFICATION']');
    check_count('Tabla ATTENDANCE_DAY existe',
        q'[SELECT COUNT(*) FROM user_tables WHERE table_name = 'ATTENDANCE_DAY']');
    check_count('Tabla AUDIT_LOG existe',
        q'[SELECT COUNT(*) FROM user_tables WHERE table_name = 'AUDIT_LOG']');

    check_count('Seed usuario director.demo existe una sola vez',
        q'[SELECT COUNT(*) FROM user_account WHERE username = 'director.demo']');
    check_count('Seed institucion demo existe una sola vez',
        q'[SELECT COUNT(*) FROM institution WHERE modular_code = '1234567']');
    check_count('Seed personal demo tiene 3 DNI esperados',
        q'[SELECT COUNT(*) FROM staff_member WHERE dni IN ('45678912', '71234567', '40112233')]',
        3);
    check_count('Relacion staff_institution demo tiene 3 filas',
        q'[
            SELECT COUNT(*)
            FROM staff_institution si
            JOIN institution i ON i.id = si.institution_id
            JOIN staff_member s ON s.id = si.staff_member_id
            WHERE i.modular_code = '1234567'
              AND s.dni IN ('45678912', '71234567', '40112233')
        ]',
        3);

    check_count('No hay usuarios demo duplicados',
        q'[
            SELECT COUNT(*)
            FROM (
                SELECT username
                FROM user_account
                WHERE username = 'director.demo'
                GROUP BY username
                HAVING COUNT(*) > 1
            )
        ]',
        0);
    check_count('No hay instituciones demo duplicadas',
        q'[
            SELECT COUNT(*)
            FROM (
                SELECT modular_code
                FROM institution
                WHERE modular_code = '1234567'
                GROUP BY modular_code
                HAVING COUNT(*) > 1
            )
        ]',
        0);

    check_count('Constraint UK_USER_ACCOUNT_USERNAME existe',
        q'[SELECT COUNT(*) FROM user_constraints WHERE constraint_name = 'UK_USER_ACCOUNT_USERNAME']');
    check_count('Constraint UK_STAFF_MEMBER_DNI existe',
        q'[SELECT COUNT(*) FROM user_constraints WHERE constraint_name = 'UK_STAFF_MEMBER_DNI']');
    check_count('Constraint UK_AD_STAFF_DATE existe',
        q'[SELECT COUNT(*) FROM user_constraints WHERE constraint_name = 'UK_AD_STAFF_DATE']');
    check_count('FK FK_AUDIT_USER existe',
        q'[SELECT COUNT(*) FROM user_constraints WHERE constraint_name = 'FK_AUDIT_USER']');

    check_count('Indice IX_BIOMETRIC_IMPORT_STATUS existe',
        q'[SELECT COUNT(*) FROM user_indexes WHERE index_name = 'IX_BIOMETRIC_IMPORT_STATUS']');
    check_count('Indice IX_AUDIT_LOG_ENTITY existe',
        q'[SELECT COUNT(*) FROM user_indexes WHERE index_name = 'IX_AUDIT_LOG_ENTITY']');

    check_count('No hay objetos invalidos',
        q'[SELECT COUNT(*) FROM user_objects WHERE status <> 'VALID']',
        0);

    IF v_errors > 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Validacion fallida. Errores: ' || v_errors);
    END IF;

    DBMS_OUTPUT.PUT_LINE('[OK] Validacion completada sin errores');
END;
/

PROMPT ============================================
PROMPT VALIDACION FINALIZADA
PROMPT ============================================

EXIT SUCCESS
