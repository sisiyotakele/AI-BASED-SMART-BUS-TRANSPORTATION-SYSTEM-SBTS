// src/features/route-search/TripPlannerCard.tsx
import React, { useState } from "react";
import { Locate, MapPin, Search, Loader2, Navigation, Info, GitMerge, CheckCircle2 } from "lucide-react";
import { RouteOption } from "./types";
import { RouteOptionCard } from "./RouteOptionCard";
import { routesApi } from "@/lib/api";

interface TripPlannerCardProps {
  onRouteSelected?: (option: RouteOption) => void;
}

const isDirectRoute = (option: RouteOption) =>
  option.transfersCount === 0 || !option.isMergedRoute;

export const TripPlannerCard: React.FC<TripPlannerCardProps> = ({ onRouteSelected }) => {
  const [origin, setOrigin] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<RouteOption[] | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const handleDetectLocation = () => {
    setIsLocating(true);
    setLocationStatus(null);

    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by your browser. Please type starting location.");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setOriginCoords({ lat: latitude, lng: longitude });
        setOrigin("Current Location");
        setLocationStatus("GPS Location detected!");
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus("Location access denied. Please type your starting location manually.");
        } else {
          setLocationStatus("Could not fetch GPS location. Please type manually.");
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSearchTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;

    setIsSearching(true);
    setSelectedRouteId(null);

    const startLoc = origin.trim() || "Your Starting Stop";
    const endLoc = destination.trim();

    try {
      let planData: unknown;
      if (originCoords) {
        const nearby = await routesApi.getNearbyStops(originCoords.lat, originCoords.lng, 5);
        const nearest = nearby.data?.data?.[0];
        if (!nearest?.stopName) {
          throw new Error("No nearby bus stop was found for the current location.");
        }
        const res = await routesApi.planRoute(nearest.stopName, endLoc);
        planData = res.data?.data;
      } else {
        const res = await routesApi.planRouteByAddress(startLoc, endLoc);
        planData = res.data?.data?.routes;
      }

      if (Array.isArray(planData) && planData.length > 0) {
        const options = (planData as RouteOption[]).sort((a, b) =>
          (a.totalTripMinutes + a.transfersCount * 5) - (b.totalTripMinutes + b.transfersCount * 5)
        );
        setSearchResults(options);
        setIsSearching(false);
        return;
      }
    } catch (err) {
      console.warn("Could not fetch real routes for planner card, using fallback options:", err);
    }


      const mockAlternatives: RouteOption[] = [
        {
          id: "opt-merged-3leg",
          isMergedRoute: true,
          transfersCount: 2,
          busNumber: "Merged Transit: Bus 1 → Bus 2 → Bus 3",
          busType: "3-Leg Multi-Bus Transit",
          nearestStation: {
            id: "st-a",
            name: `${startLoc} Terminal`,
            distanceMeters: 220,
            walkTimeMinutes: 3,
            coords: { lat: 9.01, lng: 38.75 },
          },
          busEtaMinutes: 4,
          totalTripMinutes: 42,
          fare: "30.00 ETB",
          crowdLevel: "Medium",
          routeVia: "Via Transit Stops B & C Interchanges",
          legs: [
            {
              legIndex: 1,
              fromStation: startLoc,
              toStation: "Transfer Stop B (Stadium)",
              busNumber: "Bus 1 (Bus 08 Akaki Express)",
              busType: "Anbessa Euro 5",
              departureEtaMinutes: 4,
              durationMinutes: 14,
              fare: "10.00 ETB",
            },
            {
              legIndex: 2,
              fromStation: "Transfer Stop B (Stadium)",
              toStation: "Transfer Stop C (Mexico Square)",
              busNumber: "Bus 2 (Bus 04 Rapid)",
              busType: "Sheger Express",
              departureEtaMinutes: 3,
              durationMinutes: 10,
              fare: "8.00 ETB",
              transferWaitMinutes: 4,
            },
            {
              legIndex: 3,
              fromStation: "Transfer Stop C (Mexico Square)",
              toStation: endLoc,
              busNumber: "Bus 3 (Bus 12 Direct)",
              busType: "Anbessa Standard",
              departureEtaMinutes: 5,
              durationMinutes: 14,
              fare: "12.00 ETB",
              transferWaitMinutes: 5,
            },
          ],
        },
        {
          id: "opt-merged-2leg",
          isMergedRoute: true,
          transfersCount: 1,
          busNumber: "Merged Transit: Bus 1 → Bus 2",
          busType: "2-Leg Multi-Bus Transit",
          nearestStation: {
            id: "st-b",
            name: `${startLoc} Station`,
            distanceMeters: 380,
            walkTimeMinutes: 5,
            coords: { lat: 9.02, lng: 38.77 },
          },
          busEtaMinutes: 7,
          totalTripMinutes: 36,
          fare: "25.00 ETB",
          crowdLevel: "Low",
          routeVia: "Via Transfer Stop B (Bole Atlas)",
          legs: [
            {
              legIndex: 1,
              fromStation: startLoc,
              toStation: "Transfer Stop B (Bole Atlas)",
              busNumber: "Bus 1 (Bus 34 Line)",
              busType: "Sheger Express",
              departureEtaMinutes: 7,
              durationMinutes: 18,
              fare: "12.00 ETB",
            },
            {
              legIndex: 2,
              fromStation: "Transfer Stop B (Bole Atlas)",
              toStation: endLoc,
              busNumber: "Bus 2 (Bus 12 Express)",
              busType: "Anbessa Euro 5",
              departureEtaMinutes: 4,
              durationMinutes: 14,
              fare: "13.00 ETB",
              transferWaitMinutes: 5,
            },
          ],
        },
        {
          id: "opt-direct",
          isMergedRoute: false,
          transfersCount: 0,
          busNumber: "Bus 12 Express (Direct Line)",
          busType: "Anbessa Euro 5 Direct",
          nearestStation: {
            id: "st-c",
            name: `${startLoc} Central Station`,
            distanceMeters: 450,
            walkTimeMinutes: 6,
            coords: { lat: 9.022, lng: 38.775 },
          },
          busEtaMinutes: 8,
          totalTripMinutes: 28,
          fare: "15.00 ETB",
          crowdLevel: "High",
          routeVia: "Direct Expressway Line",
        },
      ];

      setSearchResults(mockAlternatives);
      setIsSearching(false);
  };


  const displayedRoutes = searchResults || [];

  const handleSelectRoute = (option: RouteOption) => {
    setSelectedRouteId(option.id);
    onRouteSelected?.(option);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Navigation className="w-6 h-6 text-indigo-600" />
            Trip Planner & Transit Routes
          </h3>
          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs sm:text-sm font-extrabold px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
            <GitMerge className="w-4 h-4 text-indigo-600" />
            Direct & Transfer Options
          </span>
        </div>

        <form onSubmit={handleSearchTrip} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-extrabold text-slate-800">Starting Point</label>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isLocating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Locate className="w-4 h-4" />
                  )}
                  {isLocating ? "Detecting GPS..." : "Use Current Location"}
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter origin (e.g. Akaki, Mexico, Bole)..."
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-slate-200 text-sm sm:text-base font-semibold rounded-xl pl-11 pr-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <Locate className="w-5 h-5 text-indigo-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-extrabold text-slate-800">Destination</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Where are you going? (e.g. Megenagna, Tor Hailoch)"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                  className="w-full bg-[#F8FAFC] border border-slate-200 text-sm sm:text-base font-semibold rounded-xl pl-11 pr-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <MapPin className="w-5 h-5 text-rose-500 absolute left-3.5 top-3.5" />
              </div>
            </div>
          </div>

          {locationStatus && (
            <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-2 font-medium">
              <Info className="w-4 h-4 text-indigo-500 shrink-0" />
              {locationStatus}
            </p>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSearching || !destination}
              className="w-full md:w-auto text-white text-sm sm:text-base font-extrabold px-8 py-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: "#2B4B9E" }}
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              {isSearching ? "Finding routes..." : "Find Routes"}
            </button>
          </div>
        </form>
      </div>

      {searchResults && (
        <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-200/80">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Available Route Options ({displayedRoutes.length})
            </h4>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin -mx-1 px-1">
            {displayedRoutes.map((option) => (
              <RouteOptionCard
                key={option.id}
                option={option}
                destinationName={destination}
                isSelected={selectedRouteId === option.id}
                onSelectRoute={handleSelectRoute}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TripPlannerCard;
