import React from "react";
import RouteSearchPage from "../features/route-search/RouteSearchPage";
import { PassengerLayout } from "../layouts/PassengerLayout";

export const RoutesPage: React.FC = () => {
  return (
    <PassengerLayout pageTitle="Find Routes & Trip Planner">
      <RouteSearchPage />
    </PassengerLayout>
  );
};

export default RoutesPage;