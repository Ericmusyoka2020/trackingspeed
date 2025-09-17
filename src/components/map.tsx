"use client";

import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, memo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";

// Fix for default marker icon issue with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const userLocationIcon = L.divIcon({
  html: `<svg viewBox="0 0 24 24" width="32" height="32" fill="hsl(var(--primary))" stroke="white" stroke-width="1.5"><circle cx="12" cy="12" r="10" opacity="0.5"/><circle cx="12" cy="12" r="5" /></svg>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface MapViewUpdaterProps {
  position: LatLngExpression | null;
}

function MapViewUpdater({ position }: MapViewUpdaterProps) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom() < 13 ? 13 : map.getZoom());
    }
  }, [position, map]);
  return null;
}

interface MapProps {
  position: LatLngExpression | null;
  path: LatLngExpression[];
  plannedRoute: LatLngExpression[];
  savedRoute: LatLngExpression[] | null;
}

const MapComponent = ({ position, path, plannedRoute, savedRoute }: MapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const defaultPosition: LatLngExpression = [51.505, -0.09];

  useEffect(() => {
    // This effect ensures that the map instance is cleaned up when the component unmounts.
    // It's a robust way to prevent the "Map container is already initialized" error in React's strict mode.
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div id="map" className="h-full w-full z-0">
      <MapContainer
        center={position || defaultPosition}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance;
          setMap(mapInstance);
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {map && (
          <>
            {position && <Marker position={position} icon={userLocationIcon} />}
            {path.length > 0 && <Polyline positions={path} color="hsl(var(--primary))" weight={5} />}
            {plannedRoute.length > 0 && <Polyline positions={plannedRoute} color="hsl(var(--accent))" weight={5} dashArray="5, 10" />}
            {savedRoute && <Polyline positions={savedRoute} color="gray" weight={5} dashArray="5, 5" />}
            <MapViewUpdater position={position} />
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default memo(MapComponent);
