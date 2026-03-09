# Fuel Consumption Dashboard Design Guidelines

## Design Approach
**System:** Modern Data Dashboard (inspired by Tableau, Power BI, Mixpanel)
**Rationale:** Information-dense, utility-focused application requiring clarity, scannability, and data visualization excellence. Professional enterprise aesthetic with blue/white color scheme.

## Core Design Principles
- **Data First:** Visual hierarchy prioritizes critical metrics and trends
- **Scan Efficiency:** Quick comprehension through clear grouping and spacing
- **Professional Polish:** Clean, corporate aesthetic suitable for executive presentations
- **Action-Oriented:** Easy access to filtering, exporting, and drilling down into data

## Layout System

**Spacing Scale:** Tailwind units of 3, 4, 6, 8, 12 (p-3, h-8, gap-6, etc.)

**Dashboard Structure:**
```
┌─────────────────────────────────────┐
│ Header: Logo + Nav + User Actions   │
├─────────────────────────────────────┤
│ Controls Bar: Filters + Date Range  │
├──────────┬──────────┬───────────────┤
│  Metric  │  Metric  │  Metric Card  │
│  Card    │  Card    │  (Featured)   │
├──────────┴──────────┴───────────────┤
│ Consumption Chart (Full Width)      │
├───────────────┬─────────────────────┤
│ Provider Mix  │  Usage by Base      │
│ (Pie/Donut)   │  (Bar Chart)        │
├───────────────┴─────────────────────┤
│ Detailed Data Table (Sortable)      │
└─────────────────────────────────────┘
```

**Grid System:**
- Container: max-w-7xl mx-auto px-6
- Metric cards: grid-cols-1 md:grid-cols-3 gap-6
- Chart sections: grid-cols-1 lg:grid-cols-2 gap-6
- Full-width elements for primary charts and tables

## Typography

**Font Stack:** Inter (Google Fonts) for all text
- Headers: font-semibold text-2xl (Section titles)
- Metric Values: font-bold text-3xl to text-4xl (Featured numbers)
- Metric Labels: font-medium text-sm uppercase tracking-wide text-gray-600
- Body Text: font-normal text-base (Table content, descriptions)
- Captions: font-normal text-sm text-gray-500 (Timestamps, footnotes)

## Component Library

### Header Bar
- Fixed top navigation: h-16 with shadow
- Contains: Company logo (left), main nav links (center), user profile + settings icon (right)
- Background: white with subtle bottom border
- Elements: flex justify-between items-center

### Filter Controls Bar
- Height: h-20, background: gray-50, positioned below header
- Contains: Date range picker, base selector dropdown, provider filter (Veloe Go/Ticket checkboxes), export button
- Layout: flex gap-4 items-center with responsive wrapping
- All inputs: rounded-lg with consistent h-10

### Metric Cards
**Structure for each card:**
- White background, rounded-lg, p-6, shadow-sm
- Top: Icon (fuel pump, card, station) + label in gray-600 text-sm uppercase
- Middle: Large metric value text-4xl font-bold 
- Bottom: Trend indicator (↑/↓ with percentage) in green/red + comparison text "vs last month"

**Three Primary Cards:**
1. Total Fuel Consumption (liters)
2. Total Spend (currency)
3. Active Fuel Cards

### Charts

**Primary Consumption Chart (Full Width):**
- Type: Line or area chart showing fuel usage over time
- Height: h-96
- White background, rounded-lg, p-6
- Title above chart: "Consumption Trends" font-semibold text-xl
- Legend below title showing multiple data series
- Gridlines: subtle gray, horizontal only
- Use charting library: Chart.js or Recharts

**Provider Distribution (Left Column):**
- Type: Donut chart comparing Veloe Go vs Ticket usage
- Height: h-80
- Percentage labels inside segments
- Title: "Usage by Provider"
- Legend with provider logos/names

**Base Comparison (Right Column):**
- Type: Horizontal bar chart showing consumption by base/location
- Height: h-80
- Sorted descending by value
- Base names on Y-axis, consumption values on X-axis
- Title: "Consumption by Base"

### Data Table
**Structure:**
- Full width below charts
- White background, rounded-lg, overflow-hidden
- Header row: bg-gray-50, font-semibold, text-sm uppercase, sticky top
- Columns: Date | Station | Base | Provider | Card Number | Liters | Amount | Driver
- Row hover: bg-gray-50 transition
- Alternating subtle row backgrounds for readability
- Sortable columns with arrow indicators
- Pagination controls at bottom: showing "1-20 of 156 transactions"
- Row height: h-12 for comfortable scanning

### Buttons & Actions
**Primary Button (Export, Apply Filters):**
- Solid blue background, white text, rounded-lg, px-6 h-10
- font-medium text-sm

**Secondary Button (Reset, Cancel):**
- White background, gray border, gray-700 text, rounded-lg, px-6 h-10

**Icon Buttons:**
- Square w-10 h-10, rounded-lg, gray-100 background
- Contains single icon (settings, refresh, download)

### Dropdown Selectors
- Height: h-10, rounded-lg
- White background with gray-300 border
- Chevron icon on right
- Selected value in font-medium
- Dropdown menu: white, shadow-lg, rounded-lg, max-h-60 overflow-y-auto

### Date Range Picker
- Two date inputs side by side with "to" separator
- Calendar icon on left of each input
- Same styling as dropdowns
- Quick select options: "Last 7 Days", "Last 30 Days", "This Month", "Custom"

## Visual Hierarchy & Spacing

**Vertical Rhythm:**
- Header to controls: no gap (adjacent)
- Controls to metrics: mt-6
- Metrics to primary chart: mt-8
- Between chart sections: mt-8
- Charts to table: mt-8
- Table pagination: mt-4

**Card Internal Spacing:**
- Padding: p-6 consistent across all cards/charts
- Icon to label: mb-2
- Label to metric: mb-1
- Metric to trend: mt-4

## Responsive Behavior

**Desktop (lg+):** Full layout as described
**Tablet (md):** Metric cards stay 3-column, charts stack single column
**Mobile:** All elements stack single column, table becomes horizontally scrollable with sticky first column

## Data Visualization Principles
- Use blue color gradient for primary data (lighter to darker shades)
- Veloe Go: Blue shade
- Ticket: Complementary blue-gray shade
- Positive trends: green accents
- Negative trends/alerts: red accents
- Gridlines: gray-200, subtle and minimal
- Data labels: direct labeling over legends when possible

## Images Section
**No images needed** - This is a data dashboard where all visual elements are charts, graphs, and data tables. Use icons from Heroicons (outline style) for:
- Fuel pump icon for consumption metrics
- Credit card icon for card usage
- Map pin icon for base locations
- Settings gear icon
- Download/export icon