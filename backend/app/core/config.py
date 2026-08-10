from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "CHIQUISTRUKIS API"
    app_env: str = "development"
    app_debug: bool = True

    oracle_user: str = ""
    oracle_password: str = ""
    oracle_dsn: str = ""

    # Redis is external (infra/redis)
    redis_url: str = "redis://127.0.0.1:6379/0"

    access_token_expire_minutes: int = 60
    app_use_demo_store: bool = True


settings = Settings()
