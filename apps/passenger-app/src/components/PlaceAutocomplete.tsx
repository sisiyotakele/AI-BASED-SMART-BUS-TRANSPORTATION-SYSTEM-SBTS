// src/components/PlaceAutocomplete.tsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { MapPin, Bus, Search, X } from "lucide-react";
import { routesApi, BackendStop, BackendRoute } from "@/lib/api";

export interface AutocompleteItem {
  id: string;
  type: "stop" | "route";
  primaryName: string;
  secondaryInfo?: string;
  code?: string;
  startStop?: string;
  endStop?: string;
  latitude?: number;
  longitude?: number;
}

interface PlaceAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (item: AutocompleteItem) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  label?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  showRoutes?: boolean;
}

// Module-level cache to prevent repeated API hits across multiple inputs
let cachedStops: BackendStop[] | null = null;
let cachedRoutes: BackendRoute[] | null = null;
let pendingFetch: Promise<{ stops: BackendStop[]; routes: BackendRoute[] }> | null = null;

async function loadStopsAndRoutes(): Promise<{ stops: BackendStop[]; routes: BackendRoute[] }> {
  if (cachedStops && cachedRoutes) {
    return { stops: cachedStops, routes: cachedRoutes };
  }

  if (!pendingFetch) {
    pendingFetch = (async () => {
      try {
        const [stopsRes, routesRes] = await Promise.allSettled([
          routesApi.getStops(),
          routesApi.getRoutes(),
        ]);

        const stops: BackendStop[] =
          stopsRes.status === "fulfilled" && Array.isArray(stopsRes.value.data?.data)
            ? stopsRes.value.data.data
            : [];

        const routes: BackendRoute[] =
          routesRes.status === "fulfilled" && Array.isArray(routesRes.value.data?.data)
            ? routesRes.value.data.data
            : [];

        cachedStops = stops;
        cachedRoutes = routes;
        return { stops, routes };
      } catch (err) {
        console.warn("Failed to load autocomplete stops & routes:", err);
        return { stops: [], routes: [] };
      } finally {
        pendingFetch = null;
      }
    })();
  }

  return pendingFetch;
}

export const PlaceAutocomplete: React.FC<PlaceAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = "Search bus stop, station or route...",
  icon,
  label,
  required = false,
  className = "",
  inputClassName = "",
  showRoutes = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stops, setStops] = useState<BackendStop[]>([]);
  const [routes, setRoutes] = useState<BackendRoute[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch stops & routes from DB
  useEffect(() => {
    let isMounted = true;
    loadStopsAndRoutes().then(({ stops: s, routes: r }) => {
      if (isMounted) {
        setStops(s);
        setRoutes(r);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Convert raw DB items to autocomplete items and sort Alphabetically (A to Z)
  const allItems = useMemo<AutocompleteItem[]>(() => {
    const stopItems: AutocompleteItem[] = stops.map((s) => ({
      id: s.id,
      type: "stop",
      primaryName: s.stopName,
      secondaryInfo: s.address || undefined,
      code: (s as any).stopCode || undefined,
      latitude: s.latitude ? Number(s.latitude) : undefined,
      longitude: s.longitude ? Number(s.longitude) : undefined,
    }));

    const routeItems: AutocompleteItem[] = showRoutes
      ? routes.map((r) => ({
          id: r.id,
          type: "route",
          primaryName: r.routeName || (r as any).name || `Route`,
          secondaryInfo: r.description || undefined,
          startStop: r.startStop?.stopName || (r as any).origin,
          endStop: r.endStop?.stopName || (r as any).destination,
        }))
      : [];

    return [...stopItems, ...routeItems];
  }, [stops, routes, showRoutes]);

  // Filter & sort matching items alphabetically by query
  const filteredSuggestions = useMemo(() => {
    const query = value.trim().toLowerCase();

    if (!query) {
      // When input is empty, return stops sorted alphabetically (A to Z)
      return allItems
        .filter((item) => item.type === "stop")
        .sort((a, b) => a.primaryName.localeCompare(b.primaryName))
        .slice(0, 10);
    }

    // Filter items matching the query
    const matched = allItems.filter((item) => {
      const matchPrimary = item.primaryName.toLowerCase().includes(query);
      const matchSecondary = item.secondaryInfo?.toLowerCase().includes(query);
      const matchCode = item.code?.toLowerCase().includes(query);
      return matchPrimary || matchSecondary || matchCode;
    });

    // Sort alphabetically, with prefix matches ranked higher
    return matched.sort((a, b) => {
      const aStarts = a.primaryName.toLowerCase().startsWith(query);
      const bStarts = b.primaryName.toLowerCase().startsWith(query);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.primaryName.localeCompare(b.primaryName);
    }).slice(0, 12);
  }, [allItems, value]);

  const handleSelectItem = (item: AutocompleteItem) => {
    onChange(item.primaryName);
    setIsOpen(false);
    onSelect?.(item);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredSuggestions.length === 0) {
      if (e.key === "ArrowDown") setIsOpen(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % filteredSuggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
        e.preventDefault();
        handleSelectItem(filteredSuggestions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 z-10">
            {icon}
          </div>
        )}

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className={`w-full bg-[#F8FAFC] border border-slate-200 text-xs sm:text-sm font-semibold rounded-xl text-slate-800 outline-none transition focus:bg-white focus:border-[#2B4B9E] focus:ring-2 focus:ring-[#2B4B9E]/10 placeholder:text-slate-400 ${
            icon ? "pl-10" : "pl-3.5"
          } pr-8 py-2.5 sm:py-3 ${inputClassName}`}
        />

        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setIsOpen(true);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/60 transition-colors"
            title="Clear"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-h-72 overflow-y-auto overflow-x-hidden p-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-100 mb-1">
            <span>Database Places & Routes (A–Z)</span>
            <span>{filteredSuggestions.length} found</span>
          </div>

          {filteredSuggestions.length > 0 ? (
            <ul className="space-y-0.5">
              {filteredSuggestions.map((item, index) => {
                const isSelected = highlightedIndex === index;
                const isStop = item.type === "stop";

                return (
                  <li
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-sky-50 text-[#1B2A4A]"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isStop
                          ? "bg-rose-50 text-rose-600 border border-rose-100"
                          : "bg-sky-50 text-[#2B4B9E] border border-sky-100"
                      }`}
                    >
                      {isStop ? <MapPin className="w-3.5 h-3.5" /> : <Bus className="w-3.5 h-3.5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 truncate">
                          {item.primaryName}
                        </span>
                        {item.code && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-mono font-medium shrink-0">
                            {item.code}
                          </span>
                        )}
                        {!isStop && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-sky-100 text-sky-700 rounded font-bold uppercase shrink-0">
                            Route
                          </span>
                        )}
                      </div>

                      {item.secondaryInfo && (
                        <p className="text-[11px] text-slate-400 font-normal truncate">
                          {item.secondaryInfo}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="py-6 text-center text-xs text-slate-400">
              <Search className="w-5 h-5 mx-auto mb-1.5 text-slate-300" />
              No stops or routes found matching "{value}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlaceAutocomplete;
