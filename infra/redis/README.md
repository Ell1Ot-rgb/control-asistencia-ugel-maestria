# Redis (servicio aparte)

## Uso

```bash
cd infra/redis
docker compose up -d
docker compose ps
# ping: redis-cli -h 127.0.0.1 ping
```

Detener: `docker compose down` (datos en volumen). Borrar datos: `docker compose down -v`.

## Backend

`REDIS_URL=redis://127.0.0.1:6379/0` en `backend/.env`.

Si Redis está caído, autenticación/sesión debe fallar de forma controlada; el proceso API no arranca Redis.
