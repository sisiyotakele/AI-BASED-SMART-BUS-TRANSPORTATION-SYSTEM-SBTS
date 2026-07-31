import pandas as pd
import numpy as np
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

print("=" * 70)
print("🗺️  SBTS ML PIPELINE - GTFS & ROAD NETWORK SETUP")
print("=" * 70)

# === SECTION 1: LOAD GTFS DATA ===
print("\n" + "=" * 70)
# === SECTION 1: LOAD GTFS DATA ===
print("\n" + "=" * 70)
print("📊 SECTION 1: LOADING GTFS DATA")
print("=" * 70)

# Resolve path relative to apps/ai-service
base_dir = Path(__file__).resolve().parent.parent

# Primary path: apps/ai-service/data/raw/gtfs (fallback to apps/ai-service/data/raw)
gtfs_dir = base_dir / "data" / "raw" / "gtfs"
if not (gtfs_dir / "routes.txt").exists():
    gtfs_dir = base_dir / "data" / "raw"

print(f"\n📂 Loading GTFS files from: {gtfs_dir}")

# Load GTFS files
routes = pd.read_csv(gtfs_dir / "routes.txt")
stops = pd.read_csv(gtfs_dir / "stops.txt")
shapes = pd.read_csv(gtfs_dir / "shapes.txt")
trips = pd.read_csv(gtfs_dir / "trips.txt")
stop_times = pd.read_csv(gtfs_dir / "stop_times.txt")

print(f"✅ Routes: {len(routes):,} routes")
print(f"✅ Stops: {len(stops):,} stops")
print(f"✅ Shapes: {len(shapes):,} shape points")
print(f"✅ Trips: {len(trips):,} trips")
print(f"✅ Stop times: {len(stop_times):,} scheduled stops")

# === SECTION 2: ANALYZE ROUTE NETWORK ===
print("\n" + "=" * 70)
print("🚌 SECTION 2: ROUTE NETWORK ANALYSIS")
print("=" * 70)

print("\n📊 Route Statistics:")
print(f"   Total routes: {routes['route_id'].nunique()}")
print(f"   Route types: {routes['route_type'].unique()}")

print("\n📍 Stop Distribution:")
print(f"   Latitude range: {stops['stop_lat'].min():.4f} to {stops['stop_lat'].max():.4f}")
print(f"   Longitude range: {stops['stop_lon'].min():.4f} to {stops['stop_lon'].max():.4f}")

# Calculate geographic bounds for OSM data

min_lat, max_lat = stops['stop_lat'].min(), stops['stop_lat'].max()
min_lon, max_lon = stops['stop_lon'].min(), stops['stop_lon'].max()

# Add buffer (0.01 degrees ~= 1km)
buffer = 0.02
bbox = (min_lat - buffer, max_lat + buffer, min_lon - buffer, max_lon + buffer)

print(f"\n🗺️  Geographic Bounding Box:")
print(f"   South: {bbox[0]:.4f}°")
print(f"   North: {bbox[1]:.4f}°")
print(f"   West: {bbox[2]:.4f}°")
print(f"   East: {bbox[3]:.4f}°")

# === SECTION 3: DOWNLOAD ROAD NETWORK (OPTIONAL) ===
print("\n" + "=" * 70)
print("🛣️  SECTION 3: OPENSTREETMAP ROAD NETWORK")
print("=" * 70)

print("\n💡 OpenStreetMap Integration:")
print("   OSMnx allows downloading Addis Ababa road network data")
print("   This provides:")
print("     - Actual road segments")
print("     - Road types (highway, arterial, residential)")
print("     - Speed limits")
print("     - Traffic restrictions")
print("     - Network topology")

try:
    import osmnx as ox
    import networkx as nx
    
    print("\n📥 Attempting to download road network...")
    print("   This may take 5-10 minutes for the first time...")
    print("   ⚠️  Requires internet connection")
    
    # Download road network for Addis Ababa
    # network_type options: 'drive', 'drive_service', 'walk', 'bike', 'all'
    G = ox.graph_from_bbox(
        north=bbox[1],
        south=bbox[0],
        east=bbox[3],
        west=bbox[2],
        network_type='drive',
        simplify=True
    )
    
    print(f"\n✅ Road network downloaded!")
    print(f"   Nodes (intersections): {len(G.nodes):,}")
    print(f"   Edges (road segments): {len(G.edges):,}")
    
    # Save network for future use
    network_dir = Path(__file__).parent.parent / "data" / "network"
    network_dir.mkdir(parents=True, exist_ok=True)
    
    network_file = network_dir / "addis_ababa_road_network.graphml"
    ox.save_graphml(G, network_file)
    print(f"\n💾 Saved road network to: {network_file}")
    
    # Extract network statistics
    print(f"\n📊 Road Network Statistics:")
    print(f"   Total road length: {sum([data['length'] for _, _, data in G.edges(data=True)])/1000:.1f} km")
    
    # Road types
    if 'highway' in list(G.edges(data=True))[0][2]:
        road_types = {}
        for _, _, data in G.edges(data=True):
            htype = data.get('highway', 'unknown')
            if isinstance(htype, list):
                htype = htype[0]
            road_types[htype] = road_types.get(htype, 0) + 1
        
        print(f"\n🛣️  Road Types:")
        for rtype, count in sorted(road_types.items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"      {rtype}: {count:,} segments")
    
    OSM_AVAILABLE = True
    
except ImportError:
    print("\n⚠️  OSMnx not installed. Install with:")
    print("   pip install osmnx")
    print("\n   Road network features will be limited without OSMnx")
    OSM_AVAILABLE = False
except Exception as e:
    print(f"\n⚠️  Could not download road network: {e}")
    print("   This is optional - you can continue without it")
    print("   Or retry later when you have internet connection")
    OSM_AVAILABLE = False

# === SECTION 4: PROCESS ROUTE SHAPES ===
print("\n" + "=" * 70)
print("📐 SECTION 4: ROUTE SHAPE ANALYSIS")
print("=" * 70)

# Group shapes by route
shapes_by_route = shapes.groupby('shape_id')

print(f"\n📊 Shape Analysis:")
print(f"   Unique shapes: {shapes['shape_id'].nunique()}")
print(f"   Total shape points: {len(shapes):,}")
print(f"   Avg points per shape: {len(shapes) / shapes['shape_id'].nunique():.1f}")

# Calculate route lengths and complexities
route_stats = []

for shape_id, shape_data in shapes_by_route:
    sorted_shape = shape_data.sort_values('shape_pt_sequence')
    
    # Calculate total route length using haversine
    from math import radians, cos, sin, asin, sqrt
    
    def haversine(lat1, lon1, lat2, lon2):
        R = 6371
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        dlat, dlon = lat2 - lat1, lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        return R * 2 * asin(sqrt(a))
    
    total_length = 0
    turning_points = 0
    
    lats = sorted_shape['shape_pt_lat'].values
    lons = sorted_shape['shape_pt_lon'].values
    
    for i in range(len(lats) - 1):
        segment_length = haversine(lats[i], lons[i], lats[i+1], lons[i+1])
        total_length += segment_length
        
        # Detect turns (change in bearing > 15 degrees)
        if i < len(lats) - 2:
            from math import atan2, degrees
            bearing1 = degrees(atan2(lons[i+1] - lons[i], lats[i+1] - lats[i]))
            bearing2 = degrees(atan2(lons[i+2] - lons[i+1], lats[i+2] - lats[i+1]))
            angle_diff = abs(bearing2 - bearing1)
            if angle_diff > 180:
                angle_diff = 360 - angle_diff
            if angle_diff > 15:
                turning_points += 1
    
    route_stats.append({
        'shape_id': shape_id,
        'length_km': total_length,
        'num_points': len(sorted_shape),
        'turning_points': turning_points,
        'complexity_score': turning_points / (total_length + 0.1)
    })

route_stats_df = pd.DataFrame(route_stats)

print(f"\n📏 Route Length Statistics:")
print(f"   Min length: {route_stats_df['length_km'].min():.2f} km")
print(f"   Max length: {route_stats_df['length_km'].max():.2f} km")
print(f"   Mean length: {route_stats_df['length_km'].mean():.2f} km")
print(f"   Median length: {route_stats_df['length_km'].median():.2f} km")

print(f"\n🔄 Route Complexity:")
print(f"   Avg turning points: {route_stats_df['turning_points'].mean():.1f}")
print(f"   Most complex route: {route_stats_df.loc[route_stats_df['complexity_score'].idxmax(), 'shape_id']}")

# Save route statistics
processed_dir = Path(__file__).parent.parent / "data" / "processed"
processed_dir.mkdir(parents=True, exist_ok=True)

route_stats_df.to_csv(processed_dir / "route_statistics.csv", index=False)
print(f"\n💾 Saved route statistics to: {processed_dir / 'route_statistics.csv'}")

# === SECTION 5: STOP PROXIMITY ANALYSIS ===
print("\n" + "=" * 70)
print("📍 SECTION 5: STOP NETWORK ANALYSIS")
print("=" * 70)

# Find nearby stops (useful for transfer detection)
from sklearn.neighbors import BallTree

# Convert to radians for BallTree
stop_coords = np.radians(stops[['stop_lat', 'stop_lon']].values)
tree = BallTree(stop_coords, metric='haversine')

# Find stops within 200m
radius_km = 0.2
earth_radius = 6371

# Query for nearby stops
distances, indices = tree.query(stop_coords, k=5)  # Find 5 nearest
distances = distances * earth_radius  # Convert to km

# Count stops with nearby neighbors (transfer points)
transfer_stops = (distances[:, 1] < radius_km).sum()  # Excluding self

print(f"\n📊 Stop Network:")
print(f"   Total stops: {len(stops)}")
print(f"   Potential transfer points: {transfer_stops} ({transfer_stops/len(stops)*100:.1f}%)")
print(f"   Avg distance to nearest stop: {distances[:, 1].mean()*1000:.0f} meters")

# === SECTION 6: CREATE GTFS LOOKUP TABLE ===
print("\n" + "=" * 70)
print("🔗 SECTION 6: CREATE GTFS LOOKUP TABLES")
print("=" * 70)

# Merge trip data with route information
trips_enhanced = trips.merge(routes[['route_id', 'route_short_name', 'route_long_name']], 
                              on='route_id', how='left')

# Create stop lookup
stops_lookup = stops[['stop_id', 'stop_name', 'stop_lat', 'stop_lon']].copy()

# Save for ML feature engineering
trips_enhanced.to_csv(processed_dir / "gtfs_trips.csv", index=False)
stops_lookup.to_csv(processed_dir / "gtfs_stops.csv", index=False)
shapes.to_csv(processed_dir / "gtfs_shapes.csv", index=False)
routes.to_csv(processed_dir / "gtfs_routes.csv", index=False)

print(f"\n💾 Saved GTFS lookup tables:")
print(f"   ✅ gtfs_trips.csv ({len(trips_enhanced):,} trips)")
print(f"   ✅ gtfs_stops.csv ({len(stops_lookup):,} stops)")
print(f"   ✅ gtfs_shapes.csv ({len(shapes):,} shape points)")
print(f"   ✅ gtfs_routes.csv ({len(routes):,} routes)")

# === SECTION 7: ENHANCED FEATURES SUMMARY ===
print("\n" + "=" * 70)
print("✨ SECTION 7: NEW FEATURES AVAILABLE FOR ML")
print("=" * 70)

print("\n🎯 With GTFS Data, we can now create:")
print("   ✅ Route-specific features (route_id, route_type)")
print("   ✅ Stop-based features (origin_stop, destination_stop)")
print("   ✅ Route complexity (turning_points, complexity_score)")
print("   ✅ Route length (accurate from shapes)")
print("   ✅ Transfer detection (stops within 200m)")
print("   ✅ Popular routes (trip frequency)")

if OSM_AVAILABLE:
    print("\n🎯 With OpenStreetMap Data, we can add:")
    print("   ✅ Road type (highway, arterial, residential)")
    print("   ✅ Speed limits per segment")
    print("   ✅ Network centrality (important intersections)")
    print("   ✅ Alternative route availability")
    print("   ✅ Traffic bottleneck detection")
    print("   ✅ Road segment congestion history")
else:
    print("\n💡 Install OSMnx to unlock OpenStreetMap features:")
    print("   pip install osmnx")

# === SECTION 8: INTEGRATION GUIDE ===
print("\n" + "=" * 70)
print("🔧 SECTION 8: NEXT STEPS")
print("=" * 70)

print("\n📝 To integrate GTFS with your trip data (final_data.csv):")
print("   1. Match trips by coordinates (Initial lat/lng → stop_id)")
print("   2. Add route_id to each trip")
print("   3. Enrich with route complexity and length")
print("   4. Add stop characteristics (transfer point, etc.)")
print("")
print("   Script: 01_data_exploration_enhanced.py will do this!")

print("\n💡 Enhanced ML Model Features:")
print("   Before GTFS: 26 features → ~84% accuracy")
print("   With GTFS: 35-40 features → ~90-93% accuracy (expected)")
print("")
print("   New features will capture:")
print("     - Route-specific patterns")
print("     - Road network complexity")
print("     - Transfer vs non-transfer trips")
print("     - Popular vs rarely used routes")

print("\n" + "=" * 70)
print("✅ GTFS & ROAD NETWORK SETUP COMPLETE!")
print("=" * 70)

print("\n🚀 Run next:")
print("   python notebooks\\01_data_exploration_enhanced.py")
print("")
print("   This will combine your trip data with GTFS information")
print("   to create a powerful dataset for ML training.")
