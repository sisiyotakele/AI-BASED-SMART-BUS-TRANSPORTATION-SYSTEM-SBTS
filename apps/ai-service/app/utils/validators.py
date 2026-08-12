from typing import Dict, Any, Tuple
from datetime import datetime

def validate_coordinates(lat: float, lon: float) -> Tuple[bool, str]:
    """Validate latitude and longitude"""
    if not (-90 <= lat <= 90):
        return False, f"Invalid latitude: {lat}. Must be between -90 and 90"
    if not (-180 <= lon <= 180):
        return False, f"Invalid longitude: {lon}. Must be between -180 and 180"
    return True, ""

def validate_traffic_request(data: Dict[str, Any]) -> Tuple[bool, str]:
    """Validate traffic prediction request"""
    required = ['origin_lat', 'origin_lon', 'dest_lat', 'dest_lon']
    
    for field in required:
        if field not in data:
            return False, f"Missing required field: {field}"
    
    # Validate origin coordinates
    valid, msg = validate_coordinates(data['origin_lat'], data['origin_lon'])
    if not valid:
        return False, f"Origin: {msg}"
    
    # Validate destination coordinates
    valid, msg = validate_coordinates(data['dest_lat'], data['dest_lon'])
    if not valid:
        return False, f"Destination: {msg}"
    
    # Validate route_id if provided
    if 'route_id' in data and not isinstance(data['route_id'], (int, str)):
        return False, "route_id must be integer or string"
    
    return True, ""

def validate_eta_request(data: Dict[str, Any]) -> Tuple[bool, str]:
    """Validate ETA prediction request"""
    # ETA requires same fields as traffic
    valid, msg = validate_traffic_request(data)
    if not valid:
        return False, msg
    
    # Additional validation for mileage if provided
    if 'mileage' in data:
        if not isinstance(data['mileage'], (int, float)) or data['mileage'] <= 0:
            return False, "mileage must be positive number"
    
    return True, ""

def validate_batch_request(data: Dict[str, Any]) -> Tuple[bool, str]:
    """Validate batch prediction request"""
    if 'trips' not in data:
        return False, "Missing 'trips' field"
    
    if not isinstance(data['trips'], list):
        return False, "'trips' must be a list"
    
    if len(data['trips']) == 0:
        return False, "'trips' list cannot be empty"
    
    if len(data['trips']) > 100:
        return False, "Maximum 100 trips per batch request"
    
    # Validate each trip
    for i, trip in enumerate(data['trips']):
        valid, msg = validate_traffic_request(trip)
        if not valid:
            return False, f"Trip {i}: {msg}"
    
    return True, ""

def parse_timestamp(timestamp_str: str = None) -> datetime:
    """Parse timestamp string or use current time"""
    if timestamp_str:
        try:
            return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        except:
            return datetime.now()
    return datetime.now()
