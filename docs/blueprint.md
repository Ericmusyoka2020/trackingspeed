# **App Name**: RoamPilot

## Core Features:

- Geolocation Tracking: Tracks the user's location in real-time using the browser's Geolocation API. Updates position continuously, draws the traveled path, and displays a moving marker on the map.
- Real-time Stats: Calculates and displays the current speed (km/h), average speed, and total kilometers traveled using the Haversine formula.
- Place Search: Implements a search bar that uses the Nominatim API (no API key required) to find places.  The tool attempts to interpret the user's queries and use the correct location.
- Route Planning: Fetches a route from the current position to the selected destination using the OSRM public demo server.  Displays the route polyline on the map, showing route distance and estimated travel time.
- Route Recording: Saves past routes in localStorage with timestamp, and allows reloading them for future viewing and analysis.
- GPX/GeoJSON Export: Allows users to export the recorded routes in GPX or GeoJSON format.
- Tracking Controls: Provides UI controls for starting/stopping tracking, pausing/resuming, and clearing the current route.

## Style Guidelines:

- Primary color: Medium sky blue (#87CEEB) to represent openness and exploration.
- Background color: Very light gray (#F0F0F0), almost white.
- Accent color: Yellow-orange (#EBA637), used for highlights and call-to-action buttons to contrast with the blue.
- Body and headline font: 'PT Sans' (sans-serif) for a modern yet approachable feel, ensuring readability on mobile devices.
- Simple and clear icons from a library like Font Awesome or Material Icons. Use filled icons for primary actions and outlined icons for secondary actions.
- Mobile-first responsive layout. Large, touch-friendly buttons and a clear, uncluttered map interface. Information panels should be collapsible to maximize map visibility.
- Smooth transitions for map updates and route drawing. Subtle animations for button presses to provide visual feedback.