"use client";

import type { LatLngExpression, Map as LeafletMap } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

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
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface MapProps {
  position: LatLngExpression | null;
  path: LatLngExpression[];
  plannedRoute: LatLngExpression[];
  savedRoute: LatLngExpression[] | null;
}

const MapComponent = ({
  position,
  path,
  plannedRoute,
  savedRoute,
}: MapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const pathPolylineRef = useRef<L.Polyline | null>(null);
  const plannedRoutePolylineRef = useRef<L.Polyline | null>(null);
  const savedRoutePolylineRef = useRef<L.Polyline | null>(null);
  const defaultPosition: LatLngExpression = [51.505, -0.09];

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: defaultPosition,
        zoom: 13,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);
    }
  }, []);

  // Update position and marker
  useEffect(() => {
    if (mapRef.current) {
      if (position) {
        mapRef.current.setView(
          position,
          mapRef.current.getZoom() < 13 ? 13 : mapRef.current.getZoom()
        );
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng(position);
        } else {
          userMarkerRef.current = L.marker(position, {
            icon: userLocationIcon,
          }).addTo(mapRef.current);
        }
      } else if (userMarkerRef.current) {
        mapRef.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
    }
  }, [position]);

  // Update user path
  useEffect(() => {
    if (mapRef.current) {
      if (path.length > 0) {
        if (pathPolylineRef.current) {
          pathPolylineRef.current.setLatLngs(path);
        } else {
          pathPolylineRef.current = L.polyline(path, {
            color: "hsl(var(--primary))",
            weight: 5,
          }).addTo(mapRef.current);
        }
      } else if (pathPolylineRef.current) {
        mapRef.current.removeLayer(pathPolylineRef.current);
        pathPolylineRef.current = null;
      }
    }
  }, [path]);

  // Update planned route
  useEffect(() => {
    if (mapRef.current) {
      if (plannedRoute.length > 0) {
        if (plannedRoutePolylineRef.current) {
          plannedRoutePolylineRef.current.setLatLngs(plannedRoute);
        } else {
          plannedRoutePolylineRef.current = L.polyline(plannedRoute, {
            color: "hsl(var(--accent))",
            weight: 5,
            dashArray: "5, 10",
          }).addTo(mapRef.current);
        }
      } else if (plannedRoutePolylineRef.current) {
        mapRef.current.removeLayer(plannedRoutePolylineRef.current);
        plannedRoutePolylineRef.current = null;
      }
    }
  }, [plannedRoute]);

  // Update saved route
  useEffect(() => {
    if (mapRef.current) {
      if (savedRoute) {
        if (savedRoutePolylineRef.current) {
          savedRoutePolylineRef.current.setLatLngs(savedRoute);
        } else {
          savedRoutePolylineRef.current = L.polyline(savedRoute, {
            color: "gray",
            weight: 5,
            dashArray: "5, 5",
          }).addTo(mapRef.current);
        }
      } else if (savedRoutePolylineRef.current) {
        mapRef.current.removeLayer(savedRoutePolylineRef.current);
        savedRoutePolylineRef.current = null;
      }
    }
  }, [savedRoute]);

  return <div ref={mapContainerRef} className="h-full w-full z-0" />;
};

export default MapComponent;
