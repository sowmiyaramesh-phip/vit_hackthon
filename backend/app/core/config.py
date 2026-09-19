import os
from pathlib import Path
from typing import List

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR.parent / 'data'

class Settings:
    PROJECT_NAME: str = 'ATLAS + MONITOR'
    VERSION: str = '1.0.0'
    API_V1_STR: str = '/api'
    
    SECRET_KEY: str = os.getenv('SECRET_KEY', 'atlas_monitor_clinical_platform_jwt_secret_2026')
    ALGORITHM: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    
    DATABASE_URL: str = os.getenv('DATABASE_URL', f'sqlite:///{BASE_DIR}/atlas_monitor.db')
    
    AI_PROVIDER: str = os.getenv('AI_PROVIDER', 'deterministic')
    AI_MODEL: str = os.getenv('AI_MODEL', 'gemini-1.5-pro')
    AI_API_KEY: str = os.getenv('AI_API_KEY', '')
    
    NEO4J_URI: str = os.getenv('NEO4J_URI', '')
    NEO4J_USER: str = os.getenv('NEO4J_USER', 'neo4j')
    NEO4J_PASSWORD: str = os.getenv('NEO4J_PASSWORD', '')
    
    BASE_DIR: Path = BASE_DIR
    DATA_PATH: Path = DATA_DIR
    
    CORS_ORIGINS: List[str] = ['*']

settings = Settings()
