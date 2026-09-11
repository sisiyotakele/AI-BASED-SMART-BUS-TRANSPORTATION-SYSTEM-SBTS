// src/pages/DashboardPage.tsx
// Google Maps–style single-page experience:
//   • Full-screen LiveMapView always visible
//   • Desktop: collapsible left sidebar with Plan a Trip + Find Bus Stop
//   • Mobile:  floating action buttons + bottom sheet
import React from "react";
import { PassengerLayout } from "../layouts/PassengerLayout";
import { LiveMapView } from "../features/trip-tracking/LiveMapView";
import { CollapsibleSidePanel } from "../features/dashboard/CollapsibleSidePanel";

export const DashboardPage: React.FC = () => {
  return (
    <PassengerLayout mapMode>
      {/*
        Flex row filling the full height below the sticky header.
        Desktop: collapsible sidebar | map (takes all remaining space)
        Mobile: map fills screen, FABs + bottom sheet overlay
      */}
      <div className="flex flex-row h-full w-full min-w-0 min-h-0 overflow-hidden">

        {/* ── COLLAPSIBLE LEFT SIDEBAR (desktop) / FABs + sheet (mobile) ── */}
        <CollapsibleSidePanel />

        {/* ── FULL-SCREEN MAP ── */}
        <div className="flex-1 relative min-w-0 min-h-0 h-full overflow-hidden flex flex-col">
          <LiveMapView />
        </div>

      </div>
    </PassengerLayout>
  );
};

export default DashboardPage;