import joblib
from pathlib import Path
from typing import Dict, Any, Tuple
import numpy as np

class ModelLoader:
    """Handles loading ML models and their metadata"""
    
    def __init__(self, models_dir: Path):
        self.models_dir = models_dir
        self._traffic_model = None
        self._eta_model = None
        self._feature_info = None
        self._label_encoder = None
        self._traffic_metadata = None
        self._eta_metadata = None
    
    def load_traffic_model(self) -> Tuple[Any, Any, Dict]:
        """Load traffic classification model"""
        if self._traffic_model is None:
            model_path = self.models_dir / "traffic_classifier.pkl"
            encoder_path = self.models_dir / "traffic_label_encoder.pkl"
            metadata_path = self.models_dir / "traffic_classifier_metadata.pkl"
            
            self._traffic_model = joblib.load(model_path)
            self._label_encoder = joblib.load(encoder_path)
            self._traffic_metadata = joblib.load(metadata_path)
        
        return self._traffic_model, self._label_encoder, self._traffic_metadata
    
    def load_eta_model(self) -> Tuple[Any, Dict]:
        """Load ETA prediction model"""
        if self._eta_model is None:
            model_path = self.models_dir / "eta_predictor.pkl"
            metadata_path = self.models_dir / "eta_predictor_metadata.pkl"
            
            self._eta_model = joblib.load(model_path)
            self._eta_metadata = joblib.load(metadata_path)
        
        return self._eta_model, self._eta_metadata
    
    def load_feature_info(self) -> Dict:
        """Load feature preprocessing info"""
        if self._feature_info is None:
            features_dir = self.models_dir.parent.parent / "data" / "features"
            
            feature_names_path = features_dir / "feature_names.pkl"
            label_encoders_path = features_dir / "label_encoders.pkl"
            scalers_path = features_dir / "scalers.pkl"
            
            self._feature_info = {
                'names': joblib.load(feature_names_path),
                'encoders': joblib.load(label_encoders_path),
                'scalers': joblib.load(scalers_path)
            }
        
        return self._feature_info
