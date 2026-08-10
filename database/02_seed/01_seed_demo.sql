-- Demo seed (ajustar hashes en entorno real). Password demo: Demo12345
-- Hash bcrypt ejemplo debe generarse con passlib; este es placeholder documental.

INSERT INTO institution (ugel, school_name, modular_code, education_level, shift_name, is_active)
VALUES ('UGEL Demo', 'IE Demo CHIQUISTRUKIS', '1234567', 'Secundaria', 'Mañana', 'Y');

-- password_hash debe reemplazarse por hash real de Demo12345
INSERT INTO user_account (username, password_hash, role_name, is_active)
VALUES ('director.demo', '$2b$12$REPLACE_WITH_REAL_BCRYPT_HASH', 'Director', 'Y');

INSERT INTO staff_member (dni, last_names, first_names, job_title, employment_status, is_active)
VALUES
 ('45678912', 'Quispe Mamani', 'Maria Elena', 'Docente', 'Nombrado', 'Y'),
 ('71234567', 'Huaman Rojas', 'Carlos Alberto', 'Docente', 'Contratado', 'Y'),
 ('40112233', 'Flores Ilacopa', 'Leida Idalecia', 'Auxiliar', 'Nombrado', 'Y');

INSERT INTO staff_institution (staff_member_id, institution_id, start_date, is_active)
SELECT s.id, i.id, DATE '2025-03-01', 'Y'
FROM staff_member s CROSS JOIN institution i
WHERE i.modular_code = '1234567';
