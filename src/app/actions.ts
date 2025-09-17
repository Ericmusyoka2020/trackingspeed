"use server";

import { improvePlaceSearch } from "@/ai/flows/improve-place-search";

export interface Place {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
}

export interface Route {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][];
    type: string;
  };
}

export async function searchPlaces(query: string): Promise<Place[]> {
  try {
    const aiResponse = await improvePlaceSearch({ query });
    const structuredQuery = aiResponse.structuredQuery;

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        structuredQuery
      )}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch from Nominatim API");
    }
    const data = await response.json();
    return data as Place[];
  } catch (error) {
    console.error("Error searching places:", error);
    return [];
  }
}

export async function getRoute(
  from: [number, number],
  to: [number, number]
): Promise<Route | null> {
  try {
    const [fromLon, fromLat] = from;
    const [toLon, toLat] = to;

    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch route from OSRM");
    }

    const data = await response.json();

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      throw new Error("No route found");
    }

    const route = data.routes[0];
    return {
      distance: route.distance, // in meters
      duration: route.duration, // in seconds
      geometry: route.geometry,
    };
  } catch (error) {
    console.error("Error getting route:", error);
    return null;
  }
}
