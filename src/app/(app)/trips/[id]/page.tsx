import { notFound } from "next/navigation";
import { BadgeIndianRupee, Fuel, MapPinned, Scale, Truck } from "lucide-react";
import Link from "next/link";
import { TripActions } from "@/components/actions/trip-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { calculateFuelEfficiency } from "@/lib/calculations";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("trips:read");
  const { id } = await params;
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: { vehicle: true, driver: true, fuelLogs: true, expenses: true }
  });
  if (!trip) notFound();

  const activities = await prisma.activityLog.findMany({ where: { entityId: trip.id }, orderBy: { timestamp: "desc" }, take: 8 });
  const efficiency = calculateFuelEfficiency(trip.actualDistance, trip.fuelConsumed);

  return (
    <>
      <PageHeader
        title={trip.tripNumber}
        description={`${trip.source} to ${trip.destination} · ${trip.region}`}
        actions={hasPermission(user.role, "trips:manage") ? <TripActions tripId={trip.id} status={trip.status} /> : null}
      />
      <div className="mb-6 flex flex-wrap gap-2">
        <StatusBadge status={trip.status} />
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">Planned {formatDate(trip.plannedStartDate)}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Revenue" value={formatCurrency(trip.revenue)} icon={BadgeIndianRupee} />
        <MetricCard title="Cargo Weight" value={formatNumber(trip.cargoWeight, " kg")} detail={`Vehicle capacity ${formatNumber(trip.vehicle.maxLoadCapacity, " kg")}`} icon={Scale} tone="blue" />
        <MetricCard title="Distance" value={formatNumber(trip.actualDistance ?? trip.plannedDistance, " km")} detail={trip.actualDistance ? "Actual distance" : "Planned distance"} icon={MapPinned} tone="violet" />
        <MetricCard title="Fuel Efficiency" value={efficiency === null ? "N/A" : formatNumber(efficiency, " km/L")} icon={Fuel} tone="emerald" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Assignment</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm md:grid-cols-2">
              <Info label="Vehicle" value={<Link href={`/vehicles/${trip.vehicle.id}`} className="text-primary hover:underline">{trip.vehicle.registrationNumber} · {trip.vehicle.vehicleName}</Link>} />
              <Info label="Driver" value={<Link href={`/drivers/${trip.driver.id}`} className="text-primary hover:underline">{trip.driver.name}</Link>} />
              <Info label="Start Odometer" value={trip.startOdometer ? formatNumber(trip.startOdometer, " km") : "Not started"} />
              <Info label="Final Odometer" value={trip.finalOdometer ? formatNumber(trip.finalOdometer, " km") : "Not completed"} />
              <Info label="Actual Start" value={formatDateTime(trip.actualStartDate)} />
              <Info label="Completion" value={formatDateTime(trip.completionDate)} />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
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

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle><span className="inline-flex items-center gap-2"><Fuel className="h-4 w-4" />Fuel Logs</span></CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {trip.fuelLogs.length === 0 ? <p className="text-sm text-muted-foreground">No fuel logs linked.</p> : null}
            {trip.fuelLogs.map((log) => (
              <div key={log.id} className="border-b pb-3 text-sm last:border-0 last:pb-0">
                <p className="font-medium">{formatNumber(log.liters, " L")} · {formatCurrency(log.totalCost)}</p>
                <p className="text-xs text-muted-foreground">{formatDate(log.date)} · {formatNumber(log.pricePerLiter, "/L")}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle><span className="inline-flex items-center gap-2"><Truck className="h-4 w-4" />Expenses</span></CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {trip.expenses.length === 0 ? <p className="text-sm text-muted-foreground">No expenses linked.</p> : null}
            {trip.expenses.map((expense) => (
              <div key={expense.id} className="border-b pb-3 text-sm last:border-0 last:pb-0">
                <p className="font-medium">{expense.description} · {formatCurrency(expense.amount)}</p>
                <p className="text-xs text-muted-foreground">{expense.category} · {formatDate(expense.date)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
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
