import { useState } from "react";

export interface RouteItem {
  id: string;
  routeName: string;
  origin: string;
  destination: string;
  fareEtb: number;
  estimatedDurationMin: number;
  activeBusesCount: number;
}

const MOCK_ROUTES: RouteItem[] = [
  { id: "r1", routeName: "Route 101", origin: "Megenagna", destination: "Tor Hailoch", fareEtb: 10, estimatedDurationMin: 35, activeBusesCount: 4 },
  { id: "r2", routeName: "Route 204", origin: "Bole", destination: "Piyassa", fareEtb: 12, estimatedDurationMin: 25, activeBusesCount: 3 },
  { id: "r3", routeName: "Route 305", origin: "CMC", destination: "Stadium", fareEtb: 15, estimatedDurationMin: 40, activeBusesCount: 5 },
];

export const useRouteSearch = () => {
  const [search, setSearch] = useState("");
  const [routes] = useState<RouteItem[]>(MOCK_ROUTES);

  const filteredRoutes = routes.filter(
    (r) =>
      r.origin.toLowerCase().includes(search.toLowerCase()) ||
      r.destination.toLowerCase().includes(search.toLowerCase()) ||
      r.routeName.toLowerCase().includes(search.toLowerCase())
  );

  return { search, setSearch, filteredRoutes };
};