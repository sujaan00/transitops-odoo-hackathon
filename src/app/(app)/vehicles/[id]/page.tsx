import { notFound } from "next/navigation";
import { BadgeIndianRupee, Fuel, Gauge, Route, Truck, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { calculateFuelEfficiency, calculateOperationalCost, calculateVehicleRoi } from "@/lib/calculations";
import { TripStatus } from "@/lib/domain";
import { formatCurrency, formatDate, formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { asNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("vehicles:read");
  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      trips: { include: { driver: true }, orderBy: { plannedStartDate: "desc" } },
      maintenanceLogs: { orderBy: { startDate: "desc" } },
      fuelLogs: { orderBy: { date: "desc" } },
      expenses: { orderBy: { date: "desc" } }
    }
  });

  if (!vehicle) notFound();

  const activities = await prisma.activityLog.findMany({
    where: { entityId: vehicle.id },
    orderBy: { timestamp: "desc" },
    take: 6
  });
  const currentTrip = vehicle.trips.find((trip) => trip.status === TripStatus.DISPATCHED);
  const fuelCost = vehicle.fuelLogs.reduce((sum, log) => sum + asNumber(log.totalCost), 0);
  const maintenanceCost = vehicle.maintenanceLogs.reduce((sum, item) => sum + asNumber(item.cost), 0);
  const operationalCost = calculateOperationalCost(fuelCost, maintenanceCost);
  const revenue = vehicle.trips.filter((trip) => trip.status === TripStatus.COMPLETED).reduce((sum, trip) => sum + asNumber(trip.revenue), 0);
  const distance = vehicle.trips.reduce((sum, trip) => sum + asNumber(trip.actualDistance), 0);
  const fuel = vehicle.trips.reduce((sum, trip) => sum + asNumber(trip.fuelConsumed), 0);
  const efficiency = calculateFuelEfficiency(distance, fuel);
  const roi = calculateVehicleRoi(revenue, maintenanceCost, fuelCost, vehicle.acquisitionCost);

  return (
    <>
      <PageHeader title={`${vehicle.registrationNumber} · ${vehicle.vehicleName}`} description={`${vehicle.manufacturer} ${vehicle.model} · ${vehicle.vehicleType} · ${vehicle.region}`} />
      <div className="mb-6 flex flex-wrap gap-2">
        <StatusBadge status={vehicle.status} />
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">Capacity {formatNumber(vehicle.maxLoadCapacity, " kg")}</span>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">Odometer {formatNumber(vehicle.currentOdometer, " km")}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Operational Cost" value={formatCurrency(operationalCost)} detail="Fuel + maintenance" icon={BadgeIndianRupee} tone="red" />
        <MetricCard title="Fuel Efficiency" value={efficiency === null ? "N/A" : formatNumber(efficiency, " km/L")} icon={Fuel} tone="emerald" />
        <MetricCard title="ROI" value={roi === null ? "N/A" : formatPercent(roi)} detail={`Revenue ${formatCurrency(revenue)}`} icon={Gauge} />
        <MetricCard title="Trips" value={formatNumber(vehicle.trips.length)} icon={Route} tone="blue" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Vehicle Information</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm md:grid-cols-2">
              <Info label="Registration" value={vehicle.registrationNumber} />
              <Info label="Status" value={<StatusBadge status={vehicle.status} />} />
              <Info label="Acquisition Date" value={formatDate(vehicle.acquisitionDate)} />
              <Info label="Acquisition Cost" value={formatCurrency(vehicle.acquisitionCost)} />
              <Info label="Current Driver" value={currentTrip?.driver.name ?? "None"} />
              <Info label="Current Trip" value={currentTrip?.tripNumber ?? "None"} />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {activities.length === 0 ? <p className="text-sm text-muted-foreground">No activity recorded yet.</p> : null}
            {activities.map((activity) => (
              <div key={activity.id} className="border-b pb-3 last:border-0 last:pb-0">
                <p className="text-sm font-medium">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(activity.timestamp)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <History title="Fuel History" icon={Fuel} items={vehicle.fuelLogs.slice(0, 6).map((log) => [`${formatNumber(log.liters, " L")} · ${formatCurrency(log.totalCost)}`, formatDate(log.date)])} />
        <History title="Maintenance History" icon={Wrench} items={vehicle.maintenanceLogs.slice(0, 6).map((item) => [`${item.maintenanceType} · ${formatCurrency(item.cost)}`, `${formatDate(item.startDate)} · ${item.status}`])} />
        <History title="Trip History" icon={Truck} items={vehicle.trips.slice(0, 6).map((trip) => [`${trip.tripNumber} · ${trip.source} to ${trip.destination}`, `${formatDate(trip.plannedStartDate)} · ${trip.status}`])} />
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

function History({ title, icon: Icon, items }: { title: string; icon: typeof Truck; items: [string, string][] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle><span className="inline-flex items-center gap-2"><Icon className="h-4 w-4" />{title}</span></CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? <p className="text-sm text-muted-foreground">No records yet.</p> : null}
        {items.map(([primary, secondary]) => (
          <div key={`${primary}-${secondary}`} className="border-b pb-3 text-sm last:border-0 last:pb-0">
            <p className="font-medium">{primary}</p>
            <p className="mt-1 text-xs text-muted-foreground">{secondary}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
