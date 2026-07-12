import { NextResponse } from "next/server";
import { calculateFuelEfficiency, calculateOperationalCost, calculateVehicleRoi } from "@/lib/calculations";
import { TripStatus } from "@/lib/domain";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { asNumber, csvEscape } from "@/lib/utils";

export async function GET(_request: Request, context: { params: Promise<{ type: string }> }) {
  await requirePermission("reports:export");
  const { type } = await context.params;
  const rows = await buildRows(type);
  const csv = toCsv(rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="transitops-${type}.csv"`
    }
  });
}

async function buildRows(type: string) {
  if (type === "fleet-summary") {
    const vehicles = await prisma.vehicle.findMany({ orderBy: { registrationNumber: "asc" } });
    return vehicles.map((vehicle) => ({
      registrationNumber: vehicle.registrationNumber,
      vehicleName: vehicle.vehicleName,
      manufacturer: vehicle.manufacturer,
      model: vehicle.model,
      vehicleType: vehicle.vehicleType,
      status: vehicle.status,
      region: vehicle.region,
      maxLoadCapacity: vehicle.maxLoadCapacity,
      currentOdometer: vehicle.currentOdometer,
      acquisitionCost: vehicle.acquisitionCost
    }));
  }

  if (type === "driver-performance") {
    const drivers = await prisma.driver.findMany({ include: { trips: true }, orderBy: { name: "asc" } });
    return drivers.map((driver) => ({
      name: driver.name,
      licenseNumber: driver.licenseNumber,
      status: driver.status,
      safetyScore: driver.safetyScore,
      licenseExpiryDate: driver.licenseExpiryDate.toISOString(),
      trips: driver.trips.length,
      completedTrips: driver.trips.filter((trip) => trip.status === TripStatus.COMPLETED).length,
      revenue: driver.trips.reduce((sum, trip) => sum + asNumber(trip.revenue), 0)
    }));
  }

  if (type === "trip-summary") {
    const trips = await prisma.trip.findMany({ include: { vehicle: true, driver: true }, orderBy: { plannedStartDate: "desc" } });
    return trips.map((trip) => ({
      tripNumber: trip.tripNumber,
      route: `${trip.source} to ${trip.destination}`,
      region: trip.region,
      vehicle: trip.vehicle.registrationNumber,
      driver: trip.driver.name,
      cargoWeight: trip.cargoWeight,
      plannedDistance: trip.plannedDistance,
      actualDistance: trip.actualDistance,
      revenue: trip.revenue,
      status: trip.status
    }));
  }

  if (type === "maintenance-costs") {
    const records = await prisma.maintenanceLog.findMany({ include: { vehicle: true }, orderBy: { startDate: "desc" } });
    return records.map((record) => ({
      vehicle: record.vehicle.registrationNumber,
      maintenanceType: record.maintenanceType,
      status: record.status,
      startDate: record.startDate.toISOString(),
      completionDate: record.completionDate?.toISOString() ?? "",
      cost: record.cost,
      odometerAtService: record.odometerAtService,
      serviceProvider: record.serviceProvider ?? ""
    }));
  }

  if (type === "fuel-consumption") {
    const fuelLogs = await prisma.fuelLog.findMany({ include: { vehicle: true, trip: true }, orderBy: { date: "desc" } });
    return fuelLogs.map((log) => ({
      vehicle: log.vehicle.registrationNumber,
      trip: log.trip?.tripNumber ?? "",
      date: log.date.toISOString(),
      liters: log.liters,
      totalCost: log.totalCost,
      pricePerLiter: log.pricePerLiter,
      odometer: log.odometer,
      fuelStation: log.fuelStation ?? ""
    }));
  }

  if (type === "operational-expenses") {
    const expenses = await prisma.expense.findMany({ include: { vehicle: true, trip: true }, orderBy: { date: "desc" } });
    return expenses.map((expense) => ({
      vehicle: expense.vehicle.registrationNumber,
      trip: expense.trip?.tripNumber ?? "",
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      date: expense.date.toISOString(),
      receiptReference: expense.receiptReference ?? ""
    }));
  }

  const vehicles = await prisma.vehicle.findMany({ include: { trips: true, fuelLogs: true, maintenanceLogs: true }, orderBy: { registrationNumber: "asc" } });
  return vehicles.map((vehicle) => {
    const completedTrips = vehicle.trips.filter((trip) => trip.status === TripStatus.COMPLETED);
    const revenue = completedTrips.reduce((sum, trip) => sum + asNumber(trip.revenue), 0);
    const fuelCost = vehicle.fuelLogs.reduce((sum, log) => sum + asNumber(log.totalCost), 0);
    const maintenanceCost = vehicle.maintenanceLogs.reduce((sum, item) => sum + asNumber(item.cost), 0);
    const distance = completedTrips.reduce((sum, trip) => sum + asNumber(trip.actualDistance), 0);
    const fuel = completedTrips.reduce((sum, trip) => sum + asNumber(trip.fuelConsumed), 0);
    return {
      registrationNumber: vehicle.registrationNumber,
      vehicleName: vehicle.vehicleName,
      revenue,
      fuelCost,
      maintenanceCost,
      operationalCost: calculateOperationalCost(fuelCost, maintenanceCost),
      fuelEfficiency: calculateFuelEfficiency(distance, fuel) ?? "",
      roi: calculateVehicleRoi(revenue, maintenanceCost, fuelCost, vehicle.acquisitionCost) ?? ""
    };
  });
}

function toCsv(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  return [headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n");
}
