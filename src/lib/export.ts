import type { GeoPosition } from "@/hooks/use-tracking";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToGeoJSON(path: GeoPosition[]) {
  if (path.length < 2) return;

  const geoJson = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: path.map(p => [p.lng, p.lat]),
        },
      },
    ],
  };

  const blob = new Blob([JSON.stringify(geoJson, null, 2)], {
    type: "application/geo+json",
  });
  triggerDownload(blob, `roampilot-route-${Date.now()}.geojson`);
}


export function exportToGPX(path: GeoPosition[]) {
  if (path.length < 2) return;

  const points = path
    .map(p => 
        `
    <trkpt lat="${p.lat}" lon="${p.lng}">
      <time>${new Date(p.timestamp).toISOString()}</time>
    </trkpt>`
    )
    .join("");

  const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="RoamPilot" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>RoamPilot Route</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>Tracked Route</name>
    <trkseg>${points}
    </trkseg>
  </trk>
</gpx>`;

  const blob = new Blob([gpxContent], { type: "application/gpx+xml" });
  triggerDownload(blob, `roampilot-route-${Date.now()}.gpx`);
}
