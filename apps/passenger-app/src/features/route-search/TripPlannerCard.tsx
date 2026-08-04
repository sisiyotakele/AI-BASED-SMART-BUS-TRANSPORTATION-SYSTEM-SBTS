// src/features/route-search/TripPlannerCard.tsx
import React, { useState } from "react";
import { Locate, MapPin, Search, Loader2, Navigation, Info, GitMerge, CheckCircle2 } from "lucide-react";
import { RouteOption } from "./types";
import { RouteOptionCard } from "./RouteOptionCard";

export const TripPlannerCard: React.FC = () => {
  const [origin, setOrigin] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<RouteOption[] | null>(null);

  // HTML5 Geolocation Detection
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
        setOrigin(`My Current Location (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`);
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

  // Route Search Handler with Direct & Merged Transit Calculations
  const handleSearchTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;

    setIsSearching(true);

    // Simulate backend route matching query including merged transit routes
    setTimeout(() => {
      const startLoc = origin.trim() || "Location A (Akaki)";
      const endLoc = destination.trim() || "Location D (Megenagna)";

      const mockAlternatives: RouteOption[] = [
        // 1. MERGED 3-LEG TRANSIT ROUTE (A → B → C → D)
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
              busNumber: "Bus 1 (Route 08 Akaki Express)",
              busType: "Anbessa Euro 5",
              departureEtaMinutes: 4,
              durationMinutes: 14,
              fare: "10.00 ETB",
            },
            {
              legIndex: 2,
              fromStation: "Transfer Stop B (Stadium)",
              toStation: "Transfer Stop C (Mexico Square)",
              busNumber: "Bus 2 (Route 04 Rapid)",
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
              busNumber: "Bus 3 (Route 12 Direct)",
              busType: "Anbessa Standard",
              departureEtaMinutes: 5,
              durationMinutes: 14,
              fare: "12.00 ETB",
              transferWaitMinutes: 5,
            },
          ],
        },

        // 2. MERGED 2-LEG TRANSIT ROUTE (A → B → D)
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
              busNumber: "Bus 1 (Route 34 Line)",
              busType: "Sheger Express",
              departureEtaMinutes: 7,
              durationMinutes: 18,
              fare: "12.00 ETB",
            },
            {
              legIndex: 2,
              fromStation: "Transfer Stop B (Bole Atlas)",
              toStation: endLoc,
              busNumber: "Bus 2 (Route 12 Express)",
              busType: "Anbessa Euro 5",
              departureEtaMinutes: 4,
              durationMinutes: 14,
              fare: "13.00 ETB",
              transferWaitMinutes: 5,
            },
          ],
        },

        // 3. DIRECT ROUTE OPTION (If available)
        {
          id: "opt-direct",
          isMergedRoute: false,
          transfersCount: 0,
          busNumber: "Route 12 Express (Direct Line)",
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
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Trip Planner Input Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-indigo-600" />
            Trip Planner & Smart Merged Transit Routes
          </h3>
          <span className="bg-white text-indigo-600 border border-indigo-600 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <GitMerge className="w-3.5 h-3.5 text-indigo-600" />
            Auto-Merged Transfers Active
          </span>
        </div>

        <form onSubmit={handleSearchTrip} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Origin Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Starting Point (Station A)</label>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isLocating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Locate className="w-3 h-3" />
                  )}
                  {isLocating ? "Detecting GPS..." : "Use Current Location"}
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter origin (e.g. Akaki, Station A)..."
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-slate-200 text-xs font-semibold rounded-xl pl-9 pr-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <Locate className="w-4 h-4 text-indigo-500 absolute left-3 top-3" />
              </div>
            </div>

            {/* Destination Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Destination (Station D)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Where are you going? (e.g. Megenagna, Station D)..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                  className="w-full bg-[#F8FAFC] border border-slate-200 text-xs font-semibold rounded-xl pl-9 pr-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <MapPin className="w-4 h-4 text-rose-500 absolute left-3 top-3" />
              </div>
            </div>

          </div>

          {/* Location Status Message */}
          {locationStatus && (
            <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
              <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              {locationStatus}
            </p>
          )}

          {/* Search Button */}
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSearching || !destination}
              className="w-full md:w-auto bg-[#1B2A4A] hover:bg-[#283863] text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {isSearching ? "Calculating Merged Routes..." : "Find Direct & Merged Routes"}
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {searchResults && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Transit Options to {destination} ({searchResults.length} Routes Calculated)
            </h4>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {searchResults.map((option) => (
              <RouteOptionCard
                key={option.id}
                option={option}
                destinationName={destination}
                onSelectRoute={(opt) => {
                  alert(
                    opt.isMergedRoute
                      ? `Selected Merged ${opt.transfersCount}-Transfer Transit Route (${opt.busNumber})!`
                      : `Selected ${opt.busNumber}!`
                  );
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TripPlannerCard;