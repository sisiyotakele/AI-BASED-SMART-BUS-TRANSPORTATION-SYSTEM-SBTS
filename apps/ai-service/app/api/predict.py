from fastapi import APIRouter
router = APIRouter()
@router.post('/predict')
def predict(payload: dict):
    return {'message':'placeholder','input':payload}

