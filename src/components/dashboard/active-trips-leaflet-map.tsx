"use client";

import type { DivIcon, LatLngTuple, Map as LeafletMap } from "leaflet";
import { useEffect, useMemo, useRef } from "react";

type ActiveTrip = {
  id: string;
  tripNumber: string;
  source: string;
  destination: string;
  plannedDistance: unknown;
};

type CityCoordinate = {
  lat: number;
  lng: number;
};

const cityCoordinates: Record<string, CityCoordinate> = {
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Bhopal: { lat: 23.2599, lng: 77.4126 },
  Bhubaneswar: { lat: 20.2961, lng: 85.8245 },
  Chandigarh: { lat: 30.7333, lng: 76.7794 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Coimbatore: { lat: 11.0168, lng: 76.9558 },
  Delhi: { lat: 28.6139, lng: 77.209 },
  Guwahati: { lat: 26.1445, lng: 91.7362 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Indore: { lat: 22.7196, lng: 75.8577 },
  Jaipur: { lat: 26.9124, lng: 75.7873 },
  Kochi: { lat: 9.9312, lng: 76.2673 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Kozhikode: { lat: 11.2588, lng: 75.7804 },
  Ludhiana: { lat: 30.901, lng: 75.8573 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Mysuru: { lat: 12.2958, lng: 76.6394 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Surat: { lat: 21.1702, lng: 72.8311 }
};

const routeColors = ["#0f766e", "#0284c7", "#d97706", "#7c3aed", "#16a34a", "#e11d48"];

export function ActiveTripsLeafletMap({ trips }: { trips: ActiveTrip[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const tripKey = useMemo(() => trips.map((trip) => `${trip.id}:${trip.source}:${trip.destination}`).join("|"), [trips]);

  useEffect(() => {
    let cancelled = false;

    async function renderMap() {
      if (!containerRef.current) {
        return;
      }

      const L = await import("leaflet");
      if (cancelled || !containerRef.current) {
        return;
      }

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, {
          center: [22.8, 79.4],
          zoom: 5,
          zoomControl: true,
          scrollWheelZoom: false,
          attributionControl: true
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18
        }).addTo(mapRef.current);
      }

      const map = mapRef.current;
      map.eachLayer((layer) => {
        if ((layer as { options?: { pane?: string } }).options?.pane !== "tilePane") {
          layer.remove();
        }
      });

      const bounds: LatLngTuple[] = [];

      trips.forEach((trip, index) => {
        const source = getCityCoordinate(trip.source);
        const destination = getCityCoordinate(trip.destination);
        const color = routeColors[index % routeColors.length];
        const sourceLatLng: LatLngTuple = [source.lat, source.lng];
        const destinationLatLng: LatLngTuple = [destination.lat, destination.lng];

        bounds.push(sourceLatLng, destinationLatLng);

        L.polyline([sourceLatLng, destinationLatLng], {
          color,
          weight: 4,
          opacity: 0.86,
          lineCap: "round"
        })
          .bindPopup(`<strong>${trip.tripNumber}</strong><br>${trip.source} to ${trip.destination}`)
          .addTo(map);

        L.marker(sourceLatLng, { icon: markerIcon(L, color, false) })
          .bindTooltip(trip.source, { permanent: true, direction: "top", offset: [0, -10] })
          .addTo(map);

        L.marker(destinationLatLng, { icon: markerIcon(L, color, true) })
          .bindTooltip(trip.destination, { permanent: true, direction: "bottom", offset: [0, 12] })
          .addTo(map);
      });

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [52, 52], maxZoom: 7 });
      }

      window.setTimeout(() => map.invalidateSize(), 0);
    }

    void renderMap();

    return () => {
      cancelled = true;
    };
  }, [tripKey, trips]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="relative min-h-[430px] overflow-hidden rounded-lg border bg-muted">
      <div ref={containerRef} className="absolute inset-0 z-0" aria-label="OpenStreetMap view of active trip routes across India" />
      <div className="pointer-events-none absolute left-3 top-3 z-[450] rounded-md border bg-card/92 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur">
        OpenStreetMap route overlay
      </div>
    </div>
  );
}

function getCityCoordinate(city: string) {
  return cityCoordinates[city] ?? { lat: 22.8, lng: 79.4 };
}

function markerIcon(L: typeof import("leaflet"), color: string, filled: boolean): DivIcon {
  return L.divIcon({
    className: "",
    html: `<span style="
      display:block;
      width:16px;
      height:16px;
      border-radius:9999px;
      background:${filled ? color : "#fff"};
      border:4px solid ${color};
      box-shadow:0 0 0 4px rgba(255,255,255,.85),0 10px 24px rgba(15,23,42,.28);
    "></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
}
