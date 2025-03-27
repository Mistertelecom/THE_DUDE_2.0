from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "The Dude 2.0"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Configurações do Banco de Dados
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "thedude"
    SQLALCHEMY_DATABASE_URI: Optional[str] = None

    # Configurações de Segurança
    SECRET_KEY: str = "your-secret-key-here"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 dias

    # Configurações de Monitoramento
    PING_TIMEOUT: int = 2
    PING_COUNT: int = 1
    SNMP_TIMEOUT: int = 2
    SNMP_RETRIES: int = 1
    SCAN_INTERVAL: int = 300  # 5 minutos

    class Config:
        case_sensitive = True
        env_file = ".env"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.SQLALCHEMY_DATABASE_URI:
            self.SQLALCHEMY_DATABASE_URI = (
                f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                f"@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"
            )

settings = Settings() 