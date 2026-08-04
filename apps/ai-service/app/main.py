from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from pathlib import Path
from datetime import datetime
import logging
import pandas as pd

from .utils import (
    ModelLoader,
    build_feature_vector,
    validate_traffic_request,
    validate_eta_request,
    validate_batch_request,
    parse_timestamp
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="SBTS AI Service",
    description="Smart Bus Transportation System - ML Prediction API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize model loader
models_dir = Path(__file__).parent / "models"
loader = ModelLoader(models_dir)

# === REQUEST/RESPONSE MODELS ===

class TripRequest(BaseModel):
    """Single trip prediction request"""
    origin_lat: float = Field(..., ge=-90, le=90)
    origin_lon: float = Field(..., ge=-180, le=180)
    dest_lat: float = Field(..., ge=-90, le=90)
    dest_lon: float = Field(..., ge=-180, le=180)
    route_id: Optional[int] = None
    mileage: Optional[float] = None
    direction: Optional[str] = "Forward"
    timestamp: Optional[str] = None

class BatchRequest(BaseModel):
    """Batch prediction request"""
    trips: List[TripRequest]

class TrafficResponse(BaseModel):
    """Traffic prediction response"""
    traffic_level: str
    confidence: float
    processing_time_ms: float

class ETAResponse(BaseModel):
    """ETA prediction response"""
    estimated_duration_minutes: float
    estimated_arrival: str
    processing_time_ms: float

class CombinedResponse(BaseModel):
    """Combined traffic + ETA response"""
    traffic_level: str
    traffic_confidence: float
    estimated_duration_minutes: float
    estimated_arrival: str
    processing_time_ms: float

class BatchResponse(BaseModel):
    """Batch prediction response"""
    predictions: List[Dict[str, Any]]
    total_trips: int
    processing_time_ms: float

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    models_loaded: Dict[str, bool]
    timestamp: str

# === HELPER FUNCTIONS ===

def get_route_stats(route_id: Optional[int]) -> Dict[str, Any]:
    """Get route statistics (mock data for now)"""
    return {
        'complexity': 1.2,
        'avg_duration': 25.0,
        'hour_trip_count': 15,
        'route_id_encoded': route_id or 0,
        'trip_count': 120,
        'is_popular': 1 if route_id and route_id < 50 else 0,
        'origin_transfer': 0,
        'dest_transfer': 0,
        'involves_transfer': 0,
        'avg_speed': 28.5
    }

def predict_traffic(trip_data: Dict[str, Any]) -> Dict[str, Any]:
    """Predict traffic level for a trip"""
    start_time = datetime.now()
    
    # Load models
    model, label_encoder, metadata = loader.load_traffic_model()
    feature_info = loader.load_feature_info()
    
    # Build features
    route_stats = get_route_stats(trip_data.get('route_id'))
    features = build_feature_vector(trip_data, route_stats, feature_info, is_traffic=True)
    
    # Predict
    prediction = model.predict(features)[0]
    probabilities = model.predict_proba(features)[0]
    
    # Decode prediction
    traffic_level = label_encoder.inverse_transform([prediction])[0]
    confidence = float(max(probabilities))
    
    processing_time = (datetime.now() - start_time).total_seconds() * 1000
    
    return {
        'traffic_level': traffic_level,
        'confidence': confidence,
        'processing_time_ms': processing_time
    }

def predict_eta(trip_data: Dict[str, Any]) -> Dict[str, Any]:
    """Predict ETA for a trip"""
    start_time = datetime.now()
    
    # Load models
    model, metadata = loader.load_eta_model()
    feature_info = loader.load_feature_info()
    
    # Build features
    route_stats = get_route_stats(trip_data.get('route_id'))
    features = build_feature_vector(trip_data, route_stats, feature_info, is_traffic=False)
    
    # Predict
    duration_minutes = float(model.predict(features)[0])
    
    # Calculate arrival time
    timestamp = trip_data.get('timestamp', datetime.now())
    arrival_time = timestamp + pd.Timedelta(minutes=duration_minutes)
    
    processing_time = (datetime.now() - start_time).total_seconds() * 1000
    
    return {
        'estimated_duration_minutes': duration_minutes,
        'estimated_arrival': arrival_time.isoformat(),
        'processing_time_ms': processing_time
    }

# === API ENDPOINTS ===

@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint"""
    return {
        "service": "SBTS AI Service",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        traffic_loaded = (models_dir / "traffic_classifier.pkl").exists()
        eta_loaded = (models_dir / "eta_predictor.pkl").exists()
        
        return HealthResponse(
            status="healthy" if (traffic_loaded and eta_loaded) else "degraded",
            models_loaded={
                "traffic_classifier": traffic_loaded,
                "eta_predictor": eta_loaded
            },
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/traffic", response_model=TrafficResponse)
async def predict_traffic_level(request: TripRequest):
    """Predict traffic level for a single trip"""
    try:
        trip_data = {
            'origin_lat': request.origin_lat,
            'origin_lon': request.origin_lon,
            'dest_lat': request.dest_lat,
            'dest_lon': request.dest_lon,
            'route_id': request.route_id,
            'direction': request.direction,
            'timestamp': parse_timestamp(request.timestamp)
        }
        
        valid, msg = validate_traffic_request(trip_data)
        if not valid:
            raise HTTPException(status_code=400, detail=msg)
        
        result = predict_traffic(trip_data)
        return TrafficResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Traffic prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/eta", response_model=ETAResponse)
async def predict_trip_eta(request: TripRequest):
    """Predict ETA for a single trip"""
    try:
        trip_data = {
            'origin_lat': request.origin_lat,
            'origin_lon': request.origin_lon,
            'dest_lat': request.dest_lat,
            'dest_lon': request.dest_lon,
            'route_id': request.route_id,
            'mileage': request.mileage,
            'direction': request.direction,
            'timestamp': parse_timestamp(request.timestamp)
        }
        
        valid, msg = validate_eta_request(trip_data)
        if not valid:
            raise HTTPException(status_code=400, detail=msg)
        
        result = predict_eta(trip_data)
        return ETAResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ETA prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/combined", response_model=CombinedResponse)
async def predict_combined(request: TripRequest):
    """Predict both traffic and ETA for a single trip"""
    try:
        trip_data = {
            'origin_lat': request.origin_lat,
            'origin_lon': request.origin_lon,
            'dest_lat': request.dest_lat,
            'dest_lon': request.dest_lon,
            'route_id': request.route_id,
            'mileage': request.mileage,
            'direction': request.direction,
            'timestamp': parse_timestamp(request.timestamp)
        }
        
        start_time = datetime.now()
        
        traffic_result = predict_traffic(trip_data)
        eta_result = predict_eta(trip_data)
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return CombinedResponse(
            traffic_level=traffic_result['traffic_level'],
            traffic_confidence=traffic_result['confidence'],
            estimated_duration_minutes=eta_result['estimated_duration_minutes'],
            estimated_arrival=eta_result['estimated_arrival'],
            processing_time_ms=processing_time
        )
        
    except Exception as e:
        logger.error(f"Combined prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/batch", response_model=BatchResponse)
async def predict_batch(request: BatchRequest):
    """Batch prediction for multiple trips"""
    try:
        valid, msg = validate_batch_request(request.dict())
        if not valid:
            raise HTTPException(status_code=400, detail=msg)
        
        start_time = datetime.now()
        predictions = []
        
        for trip in request.trips:
            trip_data = {
                'origin_lat': trip.origin_lat,
                'origin_lon': trip.origin_lon,
                'dest_lat': trip.dest_lat,
                'dest_lon': trip.dest_lon,
                'route_id': trip.route_id,
                'timestamp': parse_timestamp(trip.timestamp)
            }
            
            traffic_result = predict_traffic(trip_data)
            eta_result = predict_eta(trip_data)
            
            predictions.append({
                **traffic_result,
                **eta_result
            })
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return BatchResponse(
            predictions=predictions,
            total_trips=len(predictions),
            processing_time_ms=processing_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000, log_level="info")
