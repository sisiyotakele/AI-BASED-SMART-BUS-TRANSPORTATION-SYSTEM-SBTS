# FIGMA DESIGN SPECIFICATION & UI/UX BLUEPRINT

This document serves as the official Figma design system, component spec, and screen blueprint for the Smart Bus Transportation System (SBTS) monorepo. It bridges the gap between the Figma design library (available in our interactive prototype viewer at `docs/figma-prototype.html`) and the frontend implementation inside `@sbts/ui-kit`, `@sbts/passenger-app`, and `@sbts/staff-app`.

---

## 1. Design Tokens (Figma Variables & Styles)

Our design system uses semantic variables to maintain style consistency and accessibility across passenger and staff platforms.

### 1.1 Color Palette

| Token Category | Variable Name | Hex Code | Usage |
| :--- | :--- | :--- | :--- |
| **Brand Primary** | `--primary-main` | `#1E3A8A` | Main theme color, primary buttons, headers |
| | `--primary-light` | `#3B82F6` | Hover states, active links, secondary accent |
| | `--primary-dark` | `#172554` | Dark headers, high-contrast text |
| **Brand Secondary** | `--secondary-main` | `#10B981` | Success states, active trip tracking, online drivers |
| | `--secondary-light` | `#D1FAE5` | Success background, notification badges |
| **Neutral Colors** | `--neutral-900` | `#0F172A` | Primary text, titles, dark icons |
| | `--neutral-600` | `#475569` | Secondary text, labels, subtitles |
| | `--neutral-300` | `#CBD5E1` | Borders, inactive icons, dividers |
| | `--neutral-100` | `#F1F5F9` | Card backgrounds, page body background |
| | `--neutral-white` | `#FFFFFF` | Core container backgrounds, button text |
| **System States** | `--status-error` | `#EF4444` | Incidents, alert icons, error states |
| | `--status-warning` | `#F59E0B` | ETA delays, pending shifts |
| | `--status-info` | `#06B6D4` | General updates, system broadcast |

### 1.2 Typography (Inter font family)

- **Display Heading 1:** `30px` (Bold, Line Height: `38px`, Tracking: `-2%`) — Page Headers, Hero Text.
- **Display Heading 2:** `24px` (Semibold, Line Height: `32px`, Tracking: `-1%`) — Modal/Card Headers.
- **Subheading:** `18px` (Medium, Line Height: `24px`) — Section Titles, Highlight Items.
- **Body Regular:** `14px` (Regular, Line Height: `20px`) — Descriptions, Input text, generic labels.
- **Body Bold / Semibold:** `14px` (Semibold, Line Height: `20px`) — Table Column Headers, Active Sidebar menu, Button labels.
- **Caption / Small:** `12px` (Regular, Line Height: `16px`) — Meta info, ETA Badges, notification timestamps.

### 1.3 Grid & Spacing Scale (8pt Grid System)

All spacing, padding, margins, and component heights adhere to an 8px grid system to ensure perfect layout alignment.

- **4px (`--space-2xs`):** Fine gaps (labels to inputs, badge margins).
- **8px (`--space-xs`):** Item spacing inside flex row (icon + text, button padding vertical).
- **16px (`--space-md`):** Core component padding (buttons horizontal, input internal, card padding).
- **24px (`--space-lg`):** Section gaps (grid gutters, spacing between cards).
- **32px (`--space-xl`):** Screen-level margins (outer layout gutters).

---

## 2. Component library Specifications (`@sbts/ui-kit`)

Our shared React component library contains building blocks designed in Figma with Auto Layout and configured using Code Connect.

### 2.1 `Button` Component
- **Figma Variants:**
  - `Type`: Primary, Secondary, Outline, Danger.
  - `Size`: Small (32px), Medium (40px), Large (48px).
  - `State`: Default, Hover, Active, Focused, Disabled.
- **Design Spec:**
  - `Border-Radius`: `8px`.
  - `Padding (Medium)`: `10px` vertical, `16px` horizontal.
  - `Font-Weight`: `600` (Semibold).
  - `Transitions`: `all 150ms ease-in-out`.

### 2.2 `DataTable` Component
- **Figma Variants:**
  - `Density`: Standard, Compact.
  - `Striped`: True/False.
- **Design Spec:**
  - `Header Background`: `--neutral-100`.
  - `Row Height (Standard)`: `52px`.
  - `Grid Lines`: `1px solid --neutral-300` bottom border only.
  - `Selection state`: Active background `rgba(59, 130, 246, 0.05)`.

### 2.3 `MapView` Component
- **Figma Variants:**
  - `ViewMode`: Interactive, Static.
- **Design Spec:**
  - `Base map background`: `--neutral-100` (simulated using light/dark map tiles).
  - `Route Line`: `4px` stroke weight, `--primary-light` with solid styling.
  - `Bus Marker`: Circular indicator (Diameter: `24px`, Background: `--secondary-main`, Outer Pulse Stroke: `4px` width at `0.3` opacity).

### 2.4 `EtaBadge` Component
- **Figma Variants:**
  - `Status`: OnTime (Green), Delayed (Red), Upcoming (Gray).
- **Design Spec:**
  - `Border-Radius`: `12px` (Pill format).
  - `Font-Size`: `12px` (Caption).
  - `Padding`: `4px` vertical, `10px` horizontal.

---

## 3. Screen Wireframes & Layouts

Below are structured wireframe designs representing the primary application flows. Use these layouts as a visual spec for coding the pages.

### 3.1 Passenger App Mockups

#### Screen A: Route Search & Stop Selection
```
+--------------------------------------------------------------+
| [=] Smart Bus System                             (N) [Profile]|
+--------------------------------------------------------------+
|  Find Your Bus Route                                         |
|  +--------------------------------------------------------+  |
|  | From: [ Select Terminal / Current Location          v ]|  |
|  | To:   [ Select Destination Terminal                 v ]|  |
|  +--------------------------------------------------------+  |
|  [ SEARCH ROUTES BUTTON (Primary) ]                          |
+--------------------------------------------------------------+
|  Active Routes Found                                         |
|  +--------------------------------------------------------+  |
|  | Route R-101: Downtown Express   [ ETA: 5 mins ]          |  |
|  | Stops: Terminal A -> Stop B -> Stop C -> Terminal B    |  |
|  | Fare: $2.50                     [ VIEW MAP BUTTON ]    |  |
|  +--------------------------------------------------------+  |
|  +--------------------------------------------------------+  |
|  | Route R-204: West Suburban      [ ETA: 12 mins ]         |  |
|  | Stops: Terminal A -> Stop X -> Stop Y -> Terminal C    |  |
|  | Fare: $3.00                     [ VIEW MAP BUTTON ]    |  |
|  +--------------------------------------------------------+  |
+--------------------------------------------------------------+
```

#### Screen B: Live Trip Tracking & ETA Map
```
+--------------------------------------------------------------+
| [<] Live Tracking: Route R-101                               |
+--------------------------------------------------------------+
|  +--------------------------------------------------------+  |
|  |                                                        |  |
|  |               [Stop B]                                 |  |
|  |                  |                                     |  |
|  |                  | <-- (Bus Moving [O] Active)          |  |
|  |                  |                                     |  |
|  |               [Stop C] (You are here)                  |  |
|  |                  |                                     |  |
|  |                  v                                     |  |
|  |               [Terminal B]                             |  |
|  |                                                        |  |
|  | [ + Zoom In ] [ - Zoom Out ]      Map View Component   |  |
|  +--------------------------------------------------------+  |
+--------------------------------------------------------------+
|  Trip Details                                                |
|  Bus Plate: NY-9831-XP  |  Driver: John Doe  |  Status: Good  |
|  Next Stop: Stop C      |  Expected Arrival: 3 minutes       |
|  [ SET NOTIFICATION ALERT ]                                  |
+--------------------------------------------------------------+
```

### 3.2 Staff App Mockups (Admin Portal)

#### Screen C: Admin Fleet Management Dashboard
```
+--------------------------------------------------------------+
| [SBTS ADMIN]  Dashboard | Fleet | Schedules | Incidents (2) |
+--------------------------------------------------------------+
| Fleet Overview                           [+ Add New Bus/Driver]|
| +---------------+ +---------------+ +---------------+        |
| | Active Buses  | | Online Drivers| | On-Duty Shifts|        |
| |     34        | |     28        | |     12        |        |
| +---------------+ +---------------+ +---------------+        |
|                                                              |
| All Registered Buses (DataTable Component)                   |
| +------------+------------------+-----------------+---------+  |
| | Bus ID     | Plate Number     | Terminal        | Status  |  |
| +------------+------------------+-----------------+---------+  |
| | BUS-101    | NY-8931-A        | Terminal East   | Active  |  |
| | BUS-102    | NY-7212-B        | Terminal West   | Maintenance|
| | BUS-103    | CA-1102-X        | Terminal Central| Active  |  |
| +------------+------------------+-----------------+---------+  |
| [<< First]  [< Prev]  Page 1 of 5  [Next >]  [Last >>]       |
+--------------------------------------------------------------+
```

#### Screen D: Driver Trip Lifecycle & GPS Transmit
```
+--------------------------------------------------------------+
| [=] Driver Portal: On Duty                       (Online)    |
+--------------------------------------------------------------+
|  Active Assignment                                           |
|  Route: R-101 (Downtown Express)  |  Bus: BUS-101            |
|  Current Run: Round 3             |  Shift Code: SF-8921     |
+--------------------------------------------------------------+
|  Trip Lifecycle Controller                                   |
|  +--------------------------------------------------------+  |
|  |  [ START TRIP ]   -->   [ ARRIVED AT STOP ]  --> [ END ]|  |
|  +--------------------------------------------------------+  |
|  Current Status: TRIP_NOT_STARTED                            |
+--------------------------------------------------------------+
|  GPS Telemetry                                               |
|  Transmission: [ ACTIVE (Pulsing Green) ]                     |
|  Latitude:  40.7128 N             |  Longitude: -74.0060 W    |
|  Speed:     24 mph                |  Accuracy:  +/- 5 meters  |
+--------------------------------------------------------------+
|  [ REPORT INCIDENT / DELAY (Danger Button) ]                 |
+--------------------------------------------------------------+
```

---

## 4. Figma to Code Linkage & Dev Mode (Code Connect)

Our team integrates Figma directly with the codebase using Code Connect. When viewing components in Dev Mode, developers will see the precise React JSX import and prop configuration instead of generic raw CSS.

### Code Connect Mappings:
1. **Figma Button Instance:**
   - Link: `https://www.figma.com/file/SBTS_Library?node-id=201`
   - Maps to: `import { Button } from '@sbts/ui-kit';`
2. **Figma DataTable Instance:**
   - Link: `https://www.figma.com/file/SBTS_Library?node-id=405`
   - Maps to: `import { DataTable } from '@sbts/ui-kit';`
3. **Figma MapView Instance:**
   - Link: `https://www.figma.com/file/SBTS_Library?node-id=912`
   - Maps to: `import { MapView } from '@sbts/ui-kit';`

*To learn more and interact with this design system, run our live local preview by opening `docs/figma-prototype.html` in your browser.*
