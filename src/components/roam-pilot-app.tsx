"use client";

import type { LatLngExpression } from "leaflet";
import dynamic from "next/dynamic";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTracking, type SavedRoute as TrackingSavedRoute } from "@/hooks/use-tracking";
import { exportToGeoJSON, exportToGPX } from "@/lib/export";
import type { Place, Route } from "@/app/actions";
import { getRoute, searchPlaces } from "@/app/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileJson,
  Download,
  Loader2,
  MapPin,
  Pause,
  Play,
  RotateCcw,
  Search,
  StopCircle,
  Trash2,
  List,
  History,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

const MapComponent = dynamic(() => import("./map"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>,
});

export default function RoamPilotApp() {
  const { toast } = useToast();
  const [savedRoutes, setSavedRoutes] = useState<TrackingSavedRoute[]>([]);
  const [loadedSavedRoute, setLoadedSavedRoute] = useState<TrackingSavedRoute | null>(null);

  const handleSaveRoute = useCallback((route: TrackingSavedRoute) => {
    const updatedRoutes = [...savedRoutes, route];
    setSavedRoutes(updatedRoutes);
    localStorage.setItem("roam-pilot-routes", JSON.stringify(updatedRoutes));
    toast({
      title: "Journey Saved",
      description: `Your journey of ${(route.distance / 1000).toFixed(2)} km has been saved.`,
    });
  }, [savedRoutes, toast]);

  const {
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
  } = useTracking({ onSave: handleSaveRoute });

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [plannedRoute, setPlannedRoute] = useState<LatLngExpression[]>([]);
  const [plannedRouteInfo, setPlannedRouteInfo] = useState<{distance: number; duration: number} | null>(null);
  const [isFetchingRoute, setIsFetchingRoute] = useState(false);

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Geolocation Error",
        description: error,
      });
    }
  }, [error, toast]);

  useEffect(() => {
    try {
      const storedRoutes = localStorage.getItem("roam-pilot-routes");
      if (storedRoutes) {
        setSavedRoutes(JSON.parse(storedRoutes));
      }
    } catch (e) {
      console.error("Failed to parse saved routes from localStorage", e);
      setSavedRoutes([]);
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      const results = await searchPlaces(searchQuery);
      setSearchResults(results);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: "Could not fetch search results.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = async (place: Place) => {
    if (!position) {
      toast({
        variant: "destructive",
        title: "Location Unknown",
        description: "Cannot plan route without your current location.",
      });
      return;
    }
    setSearchResults([]);
    setSearchQuery(place.display_name);
    setIsFetchingRoute(true);
    setPlannedRoute([]);
    setPlannedRouteInfo(null);
    try {
      const routeData = await getRoute(
        [position[1], position[0]],
        [parseFloat(place.lon), parseFloat(place.lat)]
      );
      if (routeData) {
        const routeCoords = routeData.geometry.coordinates.map(
          ([lon, lat]) => [lat, lon] as LatLngExpression
        );
        setPlannedRoute(routeCoords);
        setPlannedRouteInfo({ distance: routeData.distance, duration: routeData.duration });
      } else {
        throw new Error("No route data returned.");
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Routing Failed",
        description: "Could not fetch the route.",
      });
    } finally {
      setIsFetchingRoute(false);
    }
  };
  
  const handleClearRoute = () => {
    clearTracking();
    setPlannedRoute([]);
    setPlannedRouteInfo(null);
    setSearchQuery("");
    setSearchResults([]);
    setLoadedSavedRoute(null);
  };
  
  const handleLoadRoute = (route: TrackingSavedRoute) => {
    handleClearRoute();
    setLoadedSavedRoute(route);
  };

  const handleDeleteRoute = (timestamp: number) => {
    const updatedRoutes = savedRoutes.filter(r => r.timestamp !== timestamp);
    setSavedRoutes(updatedRoutes);
    localStorage.setItem("roam-pilot-routes", JSON.stringify(updatedRoutes));
    if(loadedSavedRoute?.timestamp === timestamp) {
      setLoadedSavedRoute(null);
    }
    toast({ title: "Journey Deleted", description: "The saved journey has been removed." });
  };
  
  const pathForMap = useMemo(() => {
    return path.map(p => [p.lat, p.lng] as LatLngExpression);
  }, [path]);

  const positionForMap = useMemo(() => {
    return position ? [position.lat, position.lng] as LatLngExpression : null;
  }, [position]);
  
  const loadedPathForMap = useMemo(() => {
    return loadedSavedRoute ? loadedSavedRoute.path.map(p => [p.lat, p.lng] as LatLngExpression) : null;
  }, [loadedSavedRoute]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-background text-foreground">
      <aside className="w-full md:w-96 md:h-full border-b md:border-b-0 md:border-r flex-shrink-0 bg-card">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-primary font-headline">RoamPilot</h1>
              <SavedRoutesSheet 
                routes={savedRoutes}
                onLoad={handleLoadRoute}
                onDelete={handleDeleteRoute}
              />
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Route Planner</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="flex gap-2 relative">
                  <Input
                    placeholder="Search for a destination..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button type="submit" size="icon" variant="secondary" disabled={isSearching}>
                    {isSearching ? <Loader2 className="animate-spin" /> : <Search />}
                  </Button>
                </form>
                {searchResults.length > 0 && (
                  <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                    {searchResults.map((place) => (
                      <button
                        key={place.place_id}
                        onClick={() => handleSelectPlace(place)}
                        className="flex items-start gap-2 w-full text-left p-2 hover:bg-muted text-sm"
                      >
                        <MapPin className="w-4 h-4 mt-1 shrink-0" />
                        <span>{place.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {isFetchingRoute && <div className="text-sm text-muted-foreground mt-2 flex items-center gap-2"><Loader2 className="animate-spin w-4 h-4" /> Fetching route...</div>}
                
                {plannedRouteInfo && (
                  <div className="mt-4 text-sm space-y-1">
                    <p><strong>Distance:</strong> {(plannedRouteInfo.distance / 1000).toFixed(2)} km</p>
                    <p><strong>Est. Time:</strong> {formatDuration(plannedRouteInfo.duration)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tracking Controls</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {status === "idle" && <Button onClick={startTracking} className="bg-green-500 hover:bg-green-600 text-white col-span-2"><Play />Start Tracking</Button>}
                {status === "tracking" && <Button onClick={pauseTracking} variant="secondary"><Pause />Pause</Button>}
                {status === "paused" && <Button onClick={resumeTracking} variant="secondary"><Play />Resume</Button>}
                {status !== "idle" && <Button onClick={stopTracking} variant="destructive"><StopCircle />Stop</Button>}
                <Button onClick={handleClearRoute} variant="outline" className="col-span-2"><RotateCcw />Clear All</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Live Statistics</CardTitle>
                <CardDescription>
                  {loadedSavedRoute ? "Displaying saved journey stats" : "Real-time tracking data"}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-center">
                  <div>
                      <p className="text-2xl font-bold">{(loadedSavedRoute ? loadedSavedRoute.stats.speed : stats.speed).toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">km/h</p>
                  </div>
                  <div>
                      <p className="text-2xl font-bold">{(loadedSavedRoute ? loadedSavedRoute.stats.avgSpeed : stats.avgSpeed).toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">Avg km/h</p>
                  </div>
                  <div>
                      <p className="text-2xl font-bold">{( (loadedSavedRoute ? loadedSavedRoute.distance : stats.distance) / 1000).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Distance (km)</p>
                  </div>
                  <div>
                      <p className="text-2xl font-bold">{formatDuration(loadedSavedRoute ? loadedSavedRoute.duration : stats.duration)}</p>
                      <p className="text-xs text-muted-foreground">Duration</p>
                  </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </aside>
      <main className="flex-1 h-full w-full">
        <MapComponent position={positionForMap} path={pathForMap} plannedRoute={plannedRoute} savedRoute={loadedPathForMap} />
      </main>
    </div>
  );
}


function SavedRoutesSheet({routes, onLoad, onDelete}: {routes: TrackingSavedRoute[], onLoad: (route: TrackingSavedRoute) => void, onDelete: (timestamp: number) => void}) {
  
  const formatSheetDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h > 0 ? `${h}h ` : ""}${m}m`;
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <History />
          <span className="sr-only">Journey History</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Journey History</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100%-4rem)] mt-4 pr-4">
        {routes.length === 0 ? (
            <p className="text-muted-foreground text-sm">No journeys saved yet.</p>
          ) : (
            <div className="space-y-4">
              {routes.sort((a,b) => b.timestamp - a.timestamp).map(route => (
                <Card key={route.timestamp}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md flex justify-between items-center">
                      <span>{new Date(route.timestamp).toLocaleString()}</span>
                       <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive h-8 w-8" onClick={() => onDelete(route.timestamp)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete Journey</span>
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm grid grid-cols-3 gap-2 mb-4">
                      <div>
                        <p className="font-bold">{(route.distance / 1000).toFixed(2)}</p> 
                        <p className="text-xs text-muted-foreground">km</p>
                      </div>
                      <div>
                        <p className="font-bold">{formatSheetDuration(route.duration)}</p> 
                        <p className="text-xs text-muted-foreground">Duration</p>
                      </div>
                      <div>
                        <p className="font-bold">{route.stats.avgSpeed.toFixed(1)}</p> 
                        <p className="text-xs text-muted-foreground">Avg km/h</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="secondary" className="flex-1" onClick={() => onLoad(route)}>Load on Map</Button>
                      <Button size="sm" variant="outline" onClick={() => exportToGPX(route.path)}><Download className="mr-2 h-4 w-4" />GPX</Button>
                      <Button size="sm" variant="outline" onClick={() => exportToGeoJSON(route.path)}><FileJson className="mr-2 h-4 w-4" />GeoJSON</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
