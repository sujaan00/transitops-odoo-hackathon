import { formatDistanceToNowStrict } from "date-fns";
import { ArrowRight, MapPinned, Navigation, Truck } from "lucide-react";
import Link from "next/link";
import { ActiveTripsLeafletMap } from "@/components/dashboard/active-trips-leaflet-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatNumber } from "@/lib/format";

type ActiveTrip = {
  id: string;
  tripNumber: string;
  source: string;
  destination: string;
  region: string;
  plannedDistance: unknown;
  cargoWeight: unknown;
  revenue: unknown;
  actualStartDate: Date | null;
  status: string;
  vehicle: {
    registrationNumber: string;
    vehicleName: string;
  };
  driver: {
    name: string;
  };
};

const routeColors = ["#14b8a6", "#38bdf8", "#f59e0b", "#a78bfa", "#22c55e", "#fb7185"];

export function ActiveTripsMap({ trips }: { trips: ActiveTrip[] }) {
  const visibleTrips = trips.slice(0, 6);

  return (
    <Card className="mt-6 overflow-hidden">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Active Trip Map</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Live dispatched routes across the current operating network.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
          <Navigation className="h-3.5 w-3.5" />
          {visibleTrips.length} in motion
        </span>
      </CardHeader>
      <CardContent>
        {visibleTrips.length === 0 ? (
          <div className="flex min-h-72 items-center justify-center rounded-lg border border-dashed bg-muted/30 text-sm text-muted-foreground">
            No active dispatched trips right now.
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
            <ActiveTripsLeafletMap trips={visibleTrips} />

            <div className="space-y-3">
              {visibleTrips.map((trip, index) => (
                <Link key={trip.id} href={`/trips/${trip.id}`} className="block rounded-lg border bg-background p-4 transition hover:bg-muted/60">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{trip.tripNumber}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        {trip.source}
                        <ArrowRight className="h-3.5 w-3.5" />
                        {trip.destination}
                      </p>
                    </div>
                    <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: routeColors[index % routeColors.length] }} />
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    <span className="inline-flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5" />
                      {trip.vehicle.registrationNumber}
                    </span>
                    <span>{trip.driver.name}</span>
                    <span>{formatNumber(trip.cargoWeight, " kg")} cargo</span>
                    <span>{formatCurrency(trip.revenue)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <StatusBadge status={trip.status} />
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPinned className="h-3.5 w-3.5" />
                      {trip.actualStartDate ? `Started ${formatDistanceToNowStrict(trip.actualStartDate, { addSuffix: true })}` : trip.region}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
