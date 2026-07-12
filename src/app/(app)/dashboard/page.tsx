import { addDays, format, isAfter, isBefore, startOfMonth, subDays } from "date-fns";
import { AlertTriangle, BadgeIndianRupee, ClipboardList, Fuel, Gauge, Route, ShieldAlert, Truck, Users, Wrench } from "lucide-react";
import Link from "next/link";
import { BarChartCard, LineChartCard, PieChartCard } from "@/components/charts/operations-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { calculateFleetUtilization, calculateFuelEfficiency, calculateOperationalCost, calculateVehicleRoi } from "@/lib/calculations";
import { DriverStatus, MaintenanceStatus, TripStatus, VehicleStatus, labelize } from "@/lib/domain";
import { formatCurrency, formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { asNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requirePermission("dashboard:read");

  const now = new Date();
  const licenseSoon = addDays(now, 30);
  const monthStart = startOfMonth(now);

  const [vehicles, drivers, trips, maintenance, fuelLogs, activities] = await Promise.all([
    prisma.vehicle.findMany({ include: { maintenanceLogs: true, fuelLogs: true, trips: true } }),
    prisma.driver.findMany({ orderBy: { licenseExpiryDate: "asc" } }),
    prisma.trip.findMany({ include: { vehicle: true, driver: true }, orderBy: { plannedStartDate: "desc" } }),
    prisma.maintenanceLog.findMany({ include: { vehicle: true }, orderBy: { startDate: "desc" } }),
    prisma.fuelLog.findMany({ include: { vehicle: true }, orderBy: { date: "desc" } }),
    prisma.activityLog.findMany({ include: { user: true }, orderBy: { timestamp: "desc" }, take: 8 })
  ]);

  const activeVehicles = vehicles.filter((vehicle) => vehicle.status !== VehicleStatus.RETIRED);
  const availableVehicles = vehicles.filter((vehicle) => vehicle.status === VehicleStatus.AVAILABLE);
  const vehiclesOnTrip = vehicles.filter((vehicle) => vehicle.status === VehicleStatus.ON_TRIP);
  const vehiclesInShop = vehicles.filter((vehicle) => vehicle.status === VehicleStatus.IN_SHOP);
  const unavailableInServiceVehicles = vehiclesOnTrip.length + vehiclesInShop.length;
  const activeTrips = trips.filter((trip) => trip.status === TripStatus.DISPATCHED);
  const pendingTrips = trips.filter((trip) => trip.status === TripStatus.DRAFT);
  const driversOnDuty = drivers.filter((driver) => driver.status === DriverStatus.ON_TRIP);
  const suspendedDrivers = drivers.filter((driver) => driver.status === DriverStatus.SUSPENDED);
  const expiringDrivers = drivers.filter((driver) => isAfter(driver.licenseExpiryDate, now) && isBefore(driver.licenseExpiryDate, licenseSoon));
  const expiredDrivers = drivers.filter((driver) => isBefore(driver.licenseExpiryDate, now));
  const activeMaintenance = maintenance.filter((item) => item.status === MaintenanceStatus.ACTIVE);
  const scheduledMaintenance = maintenance.filter((item) => item.status === MaintenanceStatus.SCHEDULED);
  const completedTrips = trips.filter((trip) => trip.status === TripStatus.COMPLETED);

  const totalFuelCost = fuelLogs.reduce((sum, log) => sum + asNumber(log.totalCost), 0);
  const totalFuelLiters = fuelLogs.reduce((sum, log) => sum + asNumber(log.liters), 0);
  const maintenanceCost = maintenance.reduce((sum, item) => sum + asNumber(item.cost), 0);
  const operationalCost = calculateOperationalCost(totalFuelCost, maintenanceCost);
  const monthlyRevenue = completedTrips
    .filter((trip) => trip.completionDate && trip.completionDate >= monthStart)
    .reduce((sum, trip) => sum + asNumber(trip.revenue), 0);
  const averageFuelEfficiency =
    completedTrips
      .map((trip) => calculateFuelEfficiency(trip.actualDistance, trip.fuelConsumed))
      .filter((value): value is number => value !== null)
      .reduce((sum, value, _, values) => sum + value / values.length, 0) || 0;
  const fleetRoi = calculateVehicleRoi(
    completedTrips.reduce((sum, trip) => sum + asNumber(trip.revenue), 0),
    maintenanceCost,
    totalFuelCost,
    vehicles.reduce((sum, vehicle) => sum + asNumber(vehicle.acquisitionCost), 0)
  );

  const tripTrend = buildDateRange(13).map((day) => ({
    day: format(day, "dd MMM"),
    trips: trips.filter((trip) => format(trip.plannedStartDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")).length,
    completed: trips.filter((trip) => trip.completionDate && format(trip.completionDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")).length
  }));

  const costTrend = buildDateRange(13).map((day) => ({
    day: format(day, "dd MMM"),
    fuel: fuelLogs.filter((log) => format(log.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")).reduce((sum, log) => sum + asNumber(log.totalCost), 0),
    maintenance: maintenance
      .filter((item) => item.completionDate && format(item.completionDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd"))
      .reduce((sum, item) => sum + asNumber(item.cost), 0)
  }));

  const fuelTrend = buildDateRange(13).map((day) => ({
    day: format(day, "dd MMM"),
    liters: fuelLogs.filter((log) => format(log.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")).reduce((sum, log) => sum + asNumber(log.liters), 0)
  }));

  const vehicleStatusDistribution = [VehicleStatus.AVAILABLE, VehicleStatus.ON_TRIP, VehicleStatus.IN_SHOP, VehicleStatus.RETIRED].map((status) => ({
    name: labelize(status),
    value: vehicles.filter((vehicle) => vehicle.status === status).length
  }));

  const tripStatusDistribution = [TripStatus.DRAFT, TripStatus.DISPATCHED, TripStatus.COMPLETED, TripStatus.CANCELLED].map((status) => ({
    name: labelize(status),
    value: trips.filter((trip) => trip.status === status).length
  }));

  const costByVehicle = vehicles
    .map((vehicle) => ({
      vehicle: vehicle.registrationNumber,
      cost:
        fuelLogs.filter((log) => log.vehicleId === vehicle.id).reduce((sum, log) => sum + asNumber(log.totalCost), 0) +
        maintenance.filter((item) => item.vehicleId === vehicle.id).reduce((sum, item) => sum + asNumber(item.cost), 0)
    }))
    .filter((item) => item.cost > 0)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 8);

  return (
    <>
      <PageHeader title="Operations Dashboard" description="Live fleet, dispatch, compliance, maintenance, and cost signals from database records." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Vehicles" value={formatNumber(vehicles.length)} icon={Truck} />
        <MetricCard title="In-Service Fleet" value={formatNumber(activeVehicles.length)} detail={`${availableVehicles.length} ready + ${vehiclesOnTrip.length} on trip + ${vehiclesInShop.length} in shop`} icon={Gauge} tone="blue" />
        <MetricCard title="Dispatch-Ready Vehicles" value={formatNumber(availableVehicles.length)} detail={`${activeVehicles.length} in service - ${unavailableInServiceVehicles} unavailable`} icon={Truck} tone="emerald" />
        <MetricCard title="Vehicles in Maintenance" value={formatNumber(vehiclesInShop.length)} icon={Wrench} tone="amber" />
        <MetricCard title="Active Trips" value={formatNumber(activeTrips.length)} icon={Route} tone="blue" />
        <MetricCard title="Pending Trips" value={formatNumber(pendingTrips.length)} icon={ClipboardList} tone="amber" />
        <MetricCard title="Drivers On Duty" value={formatNumber(driversOnDuty.length)} icon={Users} tone="violet" />
        <MetricCard title="Fleet Utilization" value={formatPercent(calculateFleetUtilization(vehiclesOnTrip.length, activeVehicles.length))} icon={Gauge} />
        <MetricCard title="Operational Cost" value={formatCurrency(operationalCost)} detail="Fuel + maintenance" icon={BadgeIndianRupee} tone="red" />
        <MetricCard title="Avg Fuel Efficiency" value={formatNumber(averageFuelEfficiency, " km/L")} detail={`${formatNumber(totalFuelLiters, " L")} logged`} icon={Fuel} tone="emerald" />
        <MetricCard title="Maintenance Due Soon" value={formatNumber(scheduledMaintenance.length)} icon={Wrench} tone="amber" />
        <MetricCard title="Fleet ROI" value={fleetRoi === null ? "N/A" : formatPercent(fleetRoi)} detail={`${formatCurrency(monthlyRevenue)} monthly revenue`} icon={BadgeIndianRupee} tone="teal" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <LineChartCard title="Trips over time" description="Planned starts and completed trips by day." data={tripTrend} xKey="day" lines={[{ key: "trips", label: "Trips" }, { key: "completed", label: "Completed" }]} />
        <LineChartCard title="Operational cost trend" description="Fuel and completed maintenance costs." data={costTrend} xKey="day" lines={[{ key: "fuel", label: "Fuel" }, { key: "maintenance", label: "Maintenance" }]} />
        <LineChartCard title="Fuel consumption trend" description="Liters logged per day." data={fuelTrend} xKey="day" lines={[{ key: "liters", label: "Liters" }]} />
        <PieChartCard title="Vehicle status distribution" data={vehicleStatusDistribution.filter((item) => item.value > 0)} />
        <PieChartCard title="Trip status distribution" data={tripStatusDistribution.filter((item) => item.value > 0)} />
        <BarChartCard title="Cost by vehicle" description="Fuel plus maintenance cost." data={costByVehicle} xKey="vehicle" bars={[{ key: "cost", label: "Cost" }]} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="border-b pb-3 last:border-0 last:pb-0">
                <p className="text-sm font-medium">{activity.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(activity.timestamp)} · {activity.user?.name ?? "System"}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attention Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <AttentionLine icon={ShieldAlert} count={expiredDrivers.length} label="Expired driver licenses" href="/drivers" />
            <AttentionLine icon={AlertTriangle} count={expiringDrivers.length} label="Licenses expiring in 30 days" href="/drivers" />
            <AttentionLine icon={Wrench} count={activeMaintenance.length} label="Vehicles under active maintenance" href="/maintenance" />
            <AttentionLine icon={Users} count={suspendedDrivers.length} label="Suspended drivers" href="/drivers" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...pendingTrips.slice(0, 3), ...scheduledMaintenance.slice(0, 2)].map((item) =>
              "tripNumber" in item ? (
                <Link key={item.id} href={`/trips/${item.id}`} className="block rounded-md border p-3 hover:bg-muted">
                  <p className="text-sm font-medium">{item.tripNumber}: {item.source} to {item.destination}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{format(item.plannedStartDate, "dd MMM yyyy")} · <StatusBadge status={item.status} /></p>
                </Link>
              ) : (
                <Link key={item.id} href="/maintenance" className="block rounded-md border p-3 hover:bg-muted">
                  <p className="text-sm font-medium">{item.maintenanceType}: {item.vehicle.registrationNumber}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{format(item.startDate, "dd MMM yyyy")} · <StatusBadge status={item.status} /></p>
                </Link>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function buildDateRange(daysBack: number) {
  return Array.from({ length: daysBack + 1 }, (_, index) => subDays(new Date(), daysBack - index));
}

function AttentionLine({ icon: Icon, count, label, href }: { icon: typeof AlertTriangle; count: number; label: string; href: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-md border p-3 hover:bg-muted">
      <span className="flex items-center gap-2 text-sm">
        <Icon className="h-4 w-4 text-amber-600" />
        {label}
      </span>
      <span className={count > 0 ? "font-semibold text-red-600" : "text-muted-foreground"}>{count}</span>
    </Link>
  );
}
