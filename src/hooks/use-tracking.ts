"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { haversineDistance } from "@/lib/haversine";

export type TrackingStatus = "idle" | "tracking" | "paused";

export interface GeoPosition {
  lat: number;
  lng: number;
  timestamp: number;
  speed: number | null; // meters per second
}

export interface TrackingStats {
  speed: number; // km/h
  avgSpeed: number; // km/h
  distance: number; // meters
  duration: number; // seconds
}

export interface SavedRoute {
  path: GeoPosition[];
  distance: number; // meters
  duration: number; // seconds
  timestamp: number;
  stats: Omit<TrackingStats, 'distance' | 'duration'>;
}

interface UseTrackingProps {
  onSave?: (route: SavedRoute) => void;
}

export function useTracking({ onSave }: UseTrackingProps) {
  const [status, setStatus] = useState<TrackingStatus>("idle");
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [path, setPath] = useState<GeoPosition[]>([]);
  const [stats, setStats] = useState<TrackingStats>({
    speed: 0,
    avgSpeed: 0,
    distance: 0,
    duration: 0,
  });
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastPositionRef = useRef<GeoPosition | null>(null);
  const trackingStartTimeRef = useRef<number | null>(null);
  const totalDurationRef = useRef<number>(0);
  const lastPauseTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === 'tracking') {
      timer = setInterval(() => {
        setStats(prevStats => {
            const duration = totalDurationRef.current + (trackingStartTimeRef.current ? (Date.now() - trackingStartTimeRef.current) / 1000 : 0);
            return {
                ...prevStats,
                duration: Math.round(duration),
                avgSpeed: duration > 0 ? (prevStats.distance / 1000) / (duration / 3600) : 0,
            }
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [status]);


  const handlePositionSuccess = (pos: GeolocationPosition) => {
    const newPosition: GeoPosition = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      timestamp: pos.timestamp,
      speed: pos.coords.speed,
    };

    setPosition(newPosition);

    setPath((prevPath) => [...prevPath, newPosition]);

    setStats((prevStats) => {
      let newDistance = prevStats.distance;
      if (lastPositionRef.current) {
        newDistance += haversineDistance(lastPositionRef.current, newPosition);
      }
      
      const currentSpeedKmh = (newPosition.speed || 0) * 3.6;

      return {
        ...prevStats,
        speed: currentSpeedKmh,
        distance: newDistance,
      };
    });

    lastPositionRef.current = newPosition;
  };

  const handlePositionError = (err: GeolocationPositionError) => {
    stopTracking();
    switch (err.code) {
      case err.PERMISSION_DENIED:
        setError("Location permission denied. Please enable it in your browser settings.");
        break;
      case err.POSITION_UNAVAILABLE:
        setError("Location information is unavailable.");
        break;
      case err.TIMEOUT:
        setError("The request to get user location timed out.");
        break;
      default:
        setError("An unknown error occurred while fetching location.");
        break;
    }
  };
  
  const startGeolocationWatch = useCallback(() => {
    if ("geolocation" in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePositionSuccess,
        handlePositionError,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  }, []);

  const clearGeolocationWatch = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const startTracking = () => {
    clearTracking();
    setError(null);
    setStatus("tracking");
    trackingStartTimeRef.current = Date.now();
    startGeolocationWatch();
  };

  const pauseTracking = () => {
    if (status !== 'tracking') return;
    clearGeolocationWatch();
    setStatus("paused");
    lastPauseTimeRef.current = Date.now();
    if(trackingStartTimeRef.current) {
        totalDurationRef.current += (Date.now() - trackingStartTimeRef.current) / 1000;
    }
  };

  const resumeTracking = () => {
    if (status !== 'paused') return;
    setStatus("tracking");
    trackingStartTimeRef.current = Date.now();
    lastPositionRef.current = path.length > 0 ? path[path.length - 1] : null;
    startGeolocationWatch();
  };

  const stopTracking = () => {
    clearGeolocationWatch();
    
    if (path.length > 1) {
      let finalDuration = totalDurationRef.current;
      if (status === 'tracking' && trackingStartTimeRef.current) {
        finalDuration += (Date.now() - trackingStartTimeRef.current) / 1000;
      }

      const finalStats: Omit<TrackingStats, 'distance' | 'duration'> = {
        speed: 0,
        avgSpeed: finalDuration > 0 ? (stats.distance / 1000) / (finalDuration / 3600) : 0,
      };

      onSave?.({
        path,
        distance: stats.distance,
        duration: Math.round(finalDuration),
        timestamp: Date.now(),
        stats: finalStats
      });
    }

    setStatus("idle");
    trackingStartTimeRef.current = null;
    totalDurationRef.current = 0;
  };
  
  const clearTracking = useCallback(() => {
    clearGeolocationWatch();
    setStatus("idle");
    setPosition(null);
    setPath([]);
    setStats({ speed: 0, avgSpeed: 0, distance: 0, duration: 0 });
    setError(null);
    lastPositionRef.current = null;
    trackingStartTimeRef.current = null;
    totalDurationRef.current = 0;
  }, []);

  return {
    status,
    startTracking,
    stopTracking,
    pauseTracking,
    resumeTracking,
    clearTracking,
    position,
    path,
    stats,
    error,
  };
}
