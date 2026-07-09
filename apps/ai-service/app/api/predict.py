from fastapi import APIRouter

router = APIRouter(prefix='/predict', tags=['predict'])


@router.post('/')
def predict(payload: dict) -> dict:
    return {
        'ok': True,
        'prediction': 'placeholder',
        'input': payload,
    }
