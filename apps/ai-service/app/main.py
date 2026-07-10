from fastapi import FastAPI

from app.api.predict import router as predict_router
from app.config import settings

app = FastAPI(title='SBTS AI Service')
app.include_router(predict_router)


@app.get('/health')
def health() -> dict[str, bool]:
    return {'ok': True}


if __name__ == '__main__':
    import uvicorn

    uvicorn.run(app, host='0.0.0.0', port=settings.ai_service_port)
