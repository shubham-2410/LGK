---
title: Sea Level Tide Tracker (Admin)
---
# Sea Level Tide Tracker (Admin)

## What & Why
Add a "Sea Level" section to the admin settings panel that fetches and displays daily tide predictions (high/low times and heights) for the kayaking location in Goa. This lets the admin quickly check tide windows before scheduling trips, using the free Stormglass.io tide API.

## Done looks like
- A new "Sea Level" item appears in the admin Settings menu under "Other Settings"
- The section has a configuration card: location name, latitude, longitude (defaults to Colva, Goa), and a Stormglass API key input field
- A date picker (defaults to today) lets the admin select any date
- The app displays a smooth SVG tide curve chart for the selected date, with labeled high tide points (blue) and low tide points (red/orange) showing times and heights in meters — similar to the Colva tide chart reference image
- A summary row below the chart lists each high/low tide event with its time and height
- If no API key is saved, the section shows a setup prompt with a link to stormglass.io to get a free key
- Settings (API key, lat, lng, location name) are persisted in the database

## Out of scope
- Public-facing tide display for customers
- Historical tide data or multi-day comparison
- Alternate tide data providers (Stormglass.io only)
- Weather or wave height data (tide extremes only)

## Tasks
1. **Schema + storage + API** — Add a `tide_settings` table (`apiKey`, `latitude`, `longitude`, `locationName`) with GET/PATCH admin endpoints. Add a backend proxy route `GET /api/admin/tide?date=YYYY-MM-DD` that fetches tide extremes from Stormglass using the stored key and returns high/low events.

2. **Settings UI + Tide Chart** — Add "Sea Level" to the admin Settings menu. Build the `SeaLevelSection` component with: API key + location config form, date picker, SVG tide curve chart with labeled high/low points, and a tide events summary list below the chart.

## Relevant files
- `shared/schema.ts`
- `server/storage.ts`
- `server/routes.ts`
- `client/src/pages/settings.tsx`