from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    ai_service_port: int = int(os.getenv('AI_SERVICE_PORT', '8000'))
    model_path: str = os.getenv('MODEL_PATH', './models/model.pkl')


settings = Settings()