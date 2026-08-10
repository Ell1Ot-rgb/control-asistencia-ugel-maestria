SET ECHO OFF
SET VERIFY OFF
SET FEEDBACK ON
SET SERVEROUTPUT ON

WHENEVER SQLERROR EXIT SQL.SQLCODE

DEFINE PDB_NAME = '&1'
DEFINE APP_USER = '&2'
DEFINE APP_PASSWORD = '&3'

PROMPT ============================================
PROMPT [1/5] CONFIGURANDO PDB Y SCHEMA
PROMPT PDB: &&PDB_NAME
PROMPT Usuario aplicacion: &&APP_USER
PROMPT ============================================

ALTER SESSION SET CONTAINER = &&PDB_NAME;

DECLARE
    v_user_count NUMBER;
    v_username VARCHAR2(128) := UPPER('&&APP_USER');
    v_password VARCHAR2(4000) := '&&APP_PASSWORD';

    PROCEDURE grant_privilege(p_privilege IN VARCHAR2) IS
        v_count NUMBER;
    BEGIN
        SELECT COUNT(*)
        INTO v_count
        FROM dba_sys_privs
        WHERE grantee = v_username
          AND privilege = UPPER(p_privilege);

        IF v_count = 0 THEN
            EXECUTE IMMEDIATE 'GRANT ' || p_privilege || ' TO ' || v_username;
            DBMS_OUTPUT.PUT_LINE('[GRANT] ' || p_privilege || ' otorgado a ' || v_username);
        ELSE
            DBMS_OUTPUT.PUT_LINE('[OK] Privilegio ' || p_privilege || ' ya existe para ' || v_username);
        END IF;
    END;
BEGIN
    SELECT COUNT(*)
    INTO v_user_count
    FROM dba_users
    WHERE username = v_username;

    IF v_user_count = 0 THEN
        EXECUTE IMMEDIATE
            'CREATE USER ' || v_username ||
            ' IDENTIFIED BY "' || REPLACE(v_password, '"', '""') || '"' ||
            ' DEFAULT TABLESPACE USERS' ||
            ' TEMPORARY TABLESPACE TEMP' ||
            ' QUOTA UNLIMITED ON USERS';
        DBMS_OUTPUT.PUT_LINE('[CREATE] Usuario ' || v_username || ' creado');
    ELSE
        EXECUTE IMMEDIATE
            'ALTER USER ' || v_username ||
            ' IDENTIFIED BY "' || REPLACE(v_password, '"', '""') || '"' ||
            ' ACCOUNT UNLOCK';
        EXECUTE IMMEDIATE 'ALTER USER ' || v_username || ' DEFAULT TABLESPACE USERS';
        EXECUTE IMMEDIATE 'ALTER USER ' || v_username || ' TEMPORARY TABLESPACE TEMP';
        EXECUTE IMMEDIATE 'ALTER USER ' || v_username || ' QUOTA UNLIMITED ON USERS';
        DBMS_OUTPUT.PUT_LINE('[OK] Usuario ' || v_username || ' ya existe; cuenta y cuota verificadas');
    END IF;

    grant_privilege('CREATE SESSION');
    grant_privilege('CREATE TABLE');
    grant_privilege('CREATE VIEW');
    grant_privilege('CREATE SEQUENCE');
    grant_privilege('CREATE PROCEDURE');
    grant_privilege('CREATE TRIGGER');
END;
/

PROMPT ============================================
PROMPT [OK] SCHEMA CONFIGURADO
PROMPT ============================================

EXIT SUCCESS
