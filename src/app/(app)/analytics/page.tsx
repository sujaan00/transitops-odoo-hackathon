import { format } from "date-fns";
import { BarChartCard, LineChartCard } from "@/components/charts/operations-charts";
import { PageHeader } from "@/components/ui/page-header";
import { calculateFleetUtilization, calculateFuelEfficiency, calculateOperationalCost, calculateVehicleRoi } from "@/lib/calculations";
import { TripStatus, VehicleStatus } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { asNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requirePermission("analytics:read");
  const [vehicles, trips, fuelLogs, maintenance] = await Promise.all([
    prisma.vehicle.findMany({ include: { trips: true, fuelLogs: true, maintenanceLogs: true } }),
    prisma.trip.findMany({ orderBy: { plannedStartDate: "asc" } }),
    prisma.fuelLog.findMany({ include: { vehicle: true }, orderBy: { date: "asc" } }),
    prisma.maintenanceLog.findMany({ include: { vehicle: true }, orderBy: { startDate: "asc" } })
  ]);

  const vehiclePerformance = vehicles.map((vehicle) => {
    const vehicleTrips = vehicle.trips.filter((trip) => trip.status === TripStatus.COMPLETED);
    const distance = vehicleTrips.reduce((sum, trip) => sum + asNumber(trip.actualDistance), 0);
    const fuel = vehicleTrips.reduce((sum, trip) => sum + asNumber(trip.fuelConsumed), 0);
    const fuelCost = vehicle.fuelLogs.reduce((sum, log) => sum + asNumber(log.totalCost), 0);
    const maintenanceCost = vehicle.maintenanceLogs.reduce((sum, item) => sum + asNumber(item.cost), 0);
    const revenue = vehicleTrips.reduce((sum, trip) => sum + asNumber(trip.revenue), 0);
    return {
      vehicle: vehicle.registrationNumber,
      efficiency: calculateFuelEfficiency(distance, fuel) ?? 0,
      operationalCost: calculateOperationalCost(fuelCost, maintenanceCost),
      revenue,
      roi: calculateVehicleRoi(revenue, maintenanceCost, fuelCost, vehicle.acquisitionCost) ?? 0
    };
  });

  const fuelCostTrend = groupByMonth(fuelLogs.map((log) => ({ date: log.date, fuel: asNumber(log.totalCost), liters: asNumber(log.liters) })));
  const maintenanceTrend = groupByMonth(maintenance.map((item) => ({ date: item.completionDate ?? item.startDate, maintenance: asNumber(item.cost) })));
  const completionTrend = groupByMonth(trips.map((trip) => ({ date: trip.completionDate ?? trip.plannedStartDate, trips: trip.status === TripStatus.COMPLETED ? 1 : 0 })));
  const fleetUtilization = calculateFleetUtilization(
    vehicles.filter((vehicle) => vehicle.status === VehicleStatus.ON_TRIP).length,
    vehicles.filter((vehicle) => vehicle.status !== VehicleStatus.RETIRED).length
  );

  return (
    <>
      <PageHeader title="Analytics" description={`Fleet utilization is currently ${fleetUtilization.toFixed(1)}%, calculated as vehicles on trip divided by active non-retired vehicles.`} />
      <div className="grid gap-4 xl:grid-cols-2">
        <BarChartCard title="Fuel efficiency by vehicle" description="Completed-trip kilometers per liter." data={vehiclePerformance.filter((item) => item.efficiency > 0)} xKey="vehicle" bars={[{ key: "efficiency", label: "km/L" }]} />
        <BarChartCard title="Operational cost by vehicle" description="Fuel cost plus maintenance cost." data={vehiclePerformance.filter((item) => item.operationalCost > 0)} xKey="vehicle" bars={[{ key: "operationalCost", label: "Cost" }]} />
        <BarChartCard title="Revenue by vehicle" description="Completed trip revenue." data={vehiclePerformance.filter((item) => item.revenue > 0)} xKey="vehicle" bars={[{ key: "revenue", label: "Revenue" }]} />
        <BarChartCard title="ROI by vehicle" description="(Revenue - fuel - maintenance) / acquisition cost." data={vehiclePerformance.filter((item) => item.roi !== 0)} xKey="vehicle" bars={[{ key: "roi", label: "ROI %" }]} />
        <LineChartCard title="Fuel cost trends" data={fuelCostTrend} xKey="month" lines={[{ key: "fuel", label: "Fuel cost" }, { key: "liters", label: "Liters" }]} />
        <LineChartCard title="Maintenance cost trends" data={maintenanceTrend} xKey="month" lines={[{ key: "maintenance", label: "Maintenance cost" }]} />
        <LineChartCard title="Trip completion trends" data={completionTrend} xKey="month" lines={[{ key: "trips", label: "Completed trips" }]} />
      </div>
    </>
  );
}

function groupByMonth(rows: Array<Record<string, unknown> & { date: Date }>) {
  const map = new Map<string, Record<string, number | string>>();
  for (const row of rows) {
    const month = format(row.date, "MMM yyyy");
    const existing = map.get(month) ?? { month };
    for (const [key, value] of Object.entries(row)) {
      if (key === "date") continue;
      existing[key] = Number(existing[key] ?? 0) + asNumber(value);
    }
    map.set(month, existing);
  }
  return Array.from(map.values());
}
