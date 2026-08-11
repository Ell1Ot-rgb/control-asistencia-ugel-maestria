# Seed demo (TEC-D02 / TEC-D12)

1. Ejecutar schema (`01_schema`).
2. Generar bcrypt de `Demo12345` e insertar en `user_account`.
3. Ejecutar `01_seed_demo.sql`.

En desarrollo, el backend puede usar usuarios demo en memoria si Oracle no está disponible (`APP_USE_DEMO_STORE=true`).
