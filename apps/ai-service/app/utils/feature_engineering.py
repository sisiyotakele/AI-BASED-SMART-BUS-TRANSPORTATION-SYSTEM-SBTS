import pandas as pd
import numpy as np
from typing import Dict, Any
from datetime import datetime

def extract_temporal_features(timestamp: datetime) -> Dict[str, float]:
    """Extract temporal features from timestamp"""
    hour = timestamp.hour
    minute = timestamp.minute
    day_of_week = timestamp.weekday()
    month = timestamp.month
    
    # Rush hour detection
    is_rush_hour = 1 if (7 <= hour <= 9) or (17 <= hour <= 19) else 0
    is_weekend = 1 if day_of_week >= 5 else 0
    
    # Cyclical encoding
    hour_sin = np.sin(2 * np.pi * hour / 24)
    hour_cos = np.cos(2 * np.pi * hour / 24)
    day_sin = np.sin(2 * np.pi * day_of_week / 7)
    day_cos = np.cos(2 * np.pi * day_of_week / 7)
    month_sin = np.sin(2 * np.pi * (month - 1) / 12)
    month_cos = np.cos(2 * np.pi * (month - 1) / 12)
    
    return {
        'hour': hour,
        'minute': minute,
        'is_rush_hour': is_rush_hour,
        'is_weekend': is_weekend,
        'DayofWeek': day_of_week,
        'Month': month,
        'hour_sin': hour_sin,
        'hour_cos': hour_cos,
        'day_sin': day_sin,
        'day_cos': day_cos,
        'month_sin': month_sin,
        'month_cos': month_cos
    }

def calculate_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate bearing between two points"""
    lat1_rad = np.radians(lat1)
    lat2_rad = np.radians(lat2)
    diff_lon = np.radians(lon2 - lon1)
    
    x = np.sin(diff_lon) * np.cos(lat2_rad)
    y = np.cos(lat1_rad) * np.sin(lat2_rad) - np.sin(lat1_rad) * np.cos(lat2_rad) * np.cos(diff_lon)
    
    bearing = np.arctan2(x, y)
    bearing = np.degrees(bearing)
    bearing = (bearing + 360) % 360
    
    return bearing

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate haversine distance in km"""
    R = 6371
    lat1_rad, lon1_rad = np.radians(lat1), np.radians(lon1)
    lat2_rad, lon2_rad = np.radians(lat2), np.radians(lon2)
    
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = np.sin(dlat/2)**2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(dlon/2)**2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
    
    return R * c

def get_time_category(hour: int) -> str:
    """Categorize time of day - matches training data categories"""
    if 6 <= hour < 10:
        return 'morning_rush'
    elif 10 <= hour < 16:
        return 'midday'
    elif 16 <= hour < 20:
        return 'evening_rush'
    elif 20 <= hour < 24:
        return 'evening'
    else:
        return 'night'

def get_direction_category(bearing: float) -> str:
    """Convert bearing to compass direction - matches training data categories"""
    if bearing < 22.5 or bearing >= 337.5:
        return 'N'
    elif bearing < 67.5:
        return 'NE'
    elif bearing < 112.5:
        return 'E'
    elif bearing < 157.5:
        return 'SE'
    elif bearing < 202.5:
        return 'S'
    elif bearing < 247.5:
        return 'SW'
    elif bearing < 292.5:
        return 'W'
    else:
        return 'NW'

def get_distance_category(distance: float) -> str:
    """Categorize distance - matches training data categories"""
    if distance < 5:
        return 'short'
    elif distance < 15:
        return 'medium'
    else:
        return 'long'

def build_feature_vector(
    trip_data: Dict[str, Any],
    route_stats: Dict[str, Any],
    feature_info: Dict,
    is_traffic: bool = True
) -> np.ndarray:
    """Build feature vector for prediction"""
    
    # Extract temporal features
    timestamp = trip_data.get('timestamp', datetime.now())
    temporal = extract_temporal_features(timestamp)
    
    # Calculate spatial features
    init_lat = trip_data['origin_lat']
    init_lon = trip_data['origin_lon']
    final_lat = trip_data['dest_lat']
    final_lon = trip_data['dest_lon']
    
    straight_dist = haversine_distance(init_lat, init_lon, final_lat, final_lon)
    bearing = calculate_bearing(init_lat, init_lon, final_lat, final_lon)
    
    # Get categories
    time_cat = get_time_category(temporal['hour'])
    dist_cat = get_distance_category(straight_dist)
    direction_cat = get_direction_category(bearing)
    
    # Encode categorical features
    encoders = feature_info['encoders']
    time_encoded = encoders['time_category'].transform([time_cat])[0]
    dist_encoded = encoders['distance_category'].transform([dist_cat])[0]
    direction_encoded = encoders['direction'].transform([direction_cat])[0]
    
    # Build feature dictionary
    features = {
        **temporal,
        'time_category_encoded': time_encoded,
        'Initial latitude ': init_lat,
        'Initial longitude': init_lon,
        'Final latitude': final_lat,
        'Final longitude': final_lon,
        'straight_distance': straight_dist,
        'bearing': bearing,
        'route_complexity_calc': route_stats.get('complexity', 1.0),
        'direction_encoded': direction_encoded,
        'Mileage': trip_data.get('mileage', straight_dist * 1.2),
        'distance_category_encoded': dist_encoded,
        'timerange_avg_duration': route_stats.get('avg_duration', 30.0),
        'hour_trip_count': route_stats.get('hour_trip_count', 10),
        'TimeRange': trip_data.get('time_range', 2),
        'route_id_encoded': route_stats.get('route_id_encoded', 0),
        'route_trip_count': route_stats.get('trip_count', 100),
        'is_popular_route': route_stats.get('is_popular', 0),
        'origin_is_transfer': route_stats.get('origin_transfer', 0),
        'dest_is_transfer': route_stats.get('dest_transfer', 0),
        'involves_transfer': route_stats.get('involves_transfer', 0),
        'route_avg_speed': route_stats.get('avg_speed', 25.0)
    }
    
    # Get feature names and build vector
    feature_names = feature_info['names']['traffic_features'] if is_traffic else feature_info['names']['eta_features']
    vector = [features.get(name, 0.0) for name in feature_names]
    
    return np.array(vector).reshape(1, -1)
