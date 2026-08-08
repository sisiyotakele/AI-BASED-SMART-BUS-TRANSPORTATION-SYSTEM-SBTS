import { useState, useEffect, useCallback } from "react";
import { routesApi } from "@/lib/api";

export interface RouteItem {
  id: string;
  routeName: string;
  origin: string;
  destination: string;
  fareEtb: number;
  estimatedDurationMin: number;
  activeBusesCount: number;
  description?: string;
}

const MOCK_FALLBACK_ROUTES: RouteItem[] = [
  { id: "r1", routeName: "Route 12 Express", origin: "Megenagna Terminal", destination: "Bole Airport", fareEtb: 15, estimatedDurationMin: 35, activeBusesCount: 6, description: "Corridor Express Line" },
  { id: "r2", routeName: "Route 04 Direct", origin: "CMC Michael", destination: "Mexico Square", fareEtb: 12, estimatedDurationMin: 25, activeBusesCount: 4, description: "Central Direct Line" },
  { id: "r3", routeName: "Route 18 Standard", origin: "Tor Hailoch", destination: "Stadium", fareEtb: 10, estimatedDurationMin: 40, activeBusesCount: 5, description: "Inner Ring Line" },
];

export const useRouteSearch = () => {
  const [search, setSearch] = useState("");
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Fetch routes from Swagger GET /routes-stops/routes
  const fetchRoutes = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await routesApi.getRoutes();
      if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
        const fetched: RouteItem[] = res.data.data.map((r: any) => ({
          id: r.id || String(Math.random()),
          routeName: r.name || r.routeName || "Route Line",
          origin: r.startTerminal?.terminalName || r.origin || "Terminal A",
          destination: r.endTerminal?.terminalName || r.destination || "Terminal B",
          fareEtb: r.fare || r.fareEtb || 12,
          estimatedDurationMin: r.estimatedDurationMin || 30,
          activeBusesCount: r.activeBusesCount || 4,
          description: r.description,
        }));
        setRoutes(fetched);
      } else {
        setRoutes(MOCK_FALLBACK_ROUTES);
      }
    } catch (err) {
      console.warn("Could not fetch /routes-stops/routes from backend, using fallback routes:", err);
      setRoutes(MOCK_FALLBACK_ROUTES);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const filteredRoutes = routes.filter(
    (r) =>
      r.origin.toLowerCase().includes(search.toLowerCase()) ||
      r.destination.toLowerCase().includes(search.toLowerCase()) ||
      r.routeName.toLowerCase().includes(search.toLowerCase())
  );

  return { search, setSearch, routes, filteredRoutes, isLoading, isRefreshing, refetch: fetchRoutes };
};