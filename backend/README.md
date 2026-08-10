# backend/ — API + negocio

Router → Service → Repository → Oracle. Sesión en **Redis externo**.

```bash
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
