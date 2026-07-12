import { beforeEach, describe, expect, it } from "vitest";
import {
  DriverStatus,
  MaintenanceStatus,
  Role,
  VehicleStatus,
  type DriverStatus as DriverStatusValue,
  type VehicleStatus as VehicleStatusValue
} from "@/lib/domain";
import {
  cancelTrip,
  completeMaintenance,
  completeTrip,
  createDriver,
  createMaintenance,
  createTrip,
  createVehicle,
  dispatchTrip
} from "@/lib/operations";
import { prisma } from "@/lib/prisma";
import { calculateFuelEfficiency, calculateOperationalCost, calculateVehicleRoi } from "@/lib/calculations";

const actorPasswordHash = "test-hash";

beforeEach(async () => {
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
});

describe("TransitOps business rules", () => {
  it("rejects duplicate vehicle registration numbers", async () => {
    const actor = await createActor();
    const input = vehicleInput("MH 12 TEST 0001");

    await createVehicle(input, actor.id);
    await expect(createVehicle(input, actor.id)).rejects.toThrow("registration number already exists");
  });

  it("blocks retired and in-shop vehicles from trip creation", async () => {
    const actor = await createActor();
    const driver = await createAvailableDriver(actor.id);
    const retired = await createVehicle(vehicleInput("MH 12 TEST 0002", VehicleStatus.RETIRED), actor.id);
    const inShop = await createVehicle(vehicleInput("MH 12 TEST 0003", VehicleStatus.IN_SHOP), actor.id);

    await expect(createTrip(tripInput(retired.id, driver.id), actor.id)).rejects.toThrow("Retired vehicles");
    await expect(createTrip(tripInput(inShop.id, driver.id), actor.id)).rejects.toThrow("undergoing maintenance");
  });

  it("blocks expired, suspended, and on-trip drivers", async () => {
    const actor = await createActor();
    const vehicle = await createAvailableVehicle(actor.id, "MH 12 TEST 0004");
    const expired = await createDriver(driverInput("Expired Driver", "EXP-1", DriverStatus.AVAILABLE, -1), actor.id);
    const suspended = await createDriver(driverInput("Suspended Driver", "SUS-1", DriverStatus.SUSPENDED, 120), actor.id);
    const onTrip = await createDriver(driverInput("Busy Driver", "BUS-1", DriverStatus.ON_TRIP, 120), actor.id);

    await expect(createTrip(tripInput(vehicle.id, expired.id), actor.id)).rejects.toThrow("license has expired");
    await expect(createTrip(tripInput(vehicle.id, suspended.id), actor.id)).rejects.toThrow("Suspended drivers");
    await expect(createTrip(tripInput(vehicle.id, onTrip.id), actor.id)).rejects.toThrow("already assigned");
  });

  it("rejects overweight cargo", async () => {
    const actor = await createActor();
    const vehicle = await createAvailableVehicle(actor.id, "MH 12 TEST 0005", 500);
    const driver = await createAvailableDriver(actor.id);

    await expect(createTrip({ ...tripInput(vehicle.id, driver.id), cargoWeight: 501 }, actor.id)).rejects.toThrow("exceeds this vehicle");
  });

  it("dispatches atomically and prevents double booking", async () => {
    const actor = await createActor();
    const vehicle = await createAvailableVehicle(actor.id, "MH 12 TEST 0006");
    const driver = await createAvailableDriver(actor.id);
    const trip = await createTrip(tripInput(vehicle.id, driver.id), actor.id);

    await dispatchTrip(trip.id, actor.id);
    const [updatedVehicle, updatedDriver, updatedTrip] = await Promise.all([
      prisma.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } }),
      prisma.driver.findUniqueOrThrow({ where: { id: driver.id } }),
      prisma.trip.findUniqueOrThrow({ where: { id: trip.id } })
    ]);

    expect(updatedVehicle.status).toBe(VehicleStatus.ON_TRIP);
    expect(updatedDriver.status).toBe(DriverStatus.ON_TRIP);
    expect(updatedTrip.status).toBe("DISPATCHED");

    const secondVehicle = await createAvailableVehicle(actor.id, "MH 12 TEST 0007");
    const secondDriver = await createAvailableDriver(actor.id, "ALT-1");
    await expect(createTrip(tripInput(vehicle.id, secondDriver.id), actor.id)).rejects.toThrow("vehicle is already assigned");
    await expect(createTrip(tripInput(secondVehicle.id, driver.id), actor.id)).rejects.toThrow("driver is already assigned");
  });

  it("completion restores statuses, updates odometer, and creates fuel log", async () => {
    const actor = await createActor();
    const vehicle = await createAvailableVehicle(actor.id, "MH 12 TEST 0008");
    const driver = await createAvailableDriver(actor.id);
    const trip = await createTrip(tripInput(vehicle.id, driver.id), actor.id);

    await dispatchTrip(trip.id, actor.id);
    await completeTrip({ tripId: trip.id, finalOdometer: 1200, fuelConsumed: 40, fuelCost: 3600 }, actor.id);

    const [updatedVehicle, updatedDriver, updatedTrip, fuelLogs] = await Promise.all([
      prisma.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } }),
      prisma.driver.findUniqueOrThrow({ where: { id: driver.id } }),
      prisma.trip.findUniqueOrThrow({ where: { id: trip.id } }),
      prisma.fuelLog.findMany({ where: { tripId: trip.id } })
    ]);

    expect(updatedVehicle.status).toBe(VehicleStatus.AVAILABLE);
    expect(updatedVehicle.currentOdometer).toBe(1200);
    expect(updatedDriver.status).toBe(DriverStatus.AVAILABLE);
    expect(updatedTrip.status).toBe("COMPLETED");
    expect(fuelLogs).toHaveLength(1);
  });

  it("cancelling a dispatched trip restores vehicle and driver availability", async () => {
    const actor = await createActor();
    const vehicle = await createAvailableVehicle(actor.id, "MH 12 TEST 0009");
    const driver = await createAvailableDriver(actor.id);
    const trip = await createTrip(tripInput(vehicle.id, driver.id), actor.id);

    await dispatchTrip(trip.id, actor.id);
    await cancelTrip(trip.id, actor.id);

    await expect(prisma.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } })).resolves.toMatchObject({ status: VehicleStatus.AVAILABLE });
    await expect(prisma.driver.findUniqueOrThrow({ where: { id: driver.id } })).resolves.toMatchObject({ status: DriverStatus.AVAILABLE });
    await expect(prisma.trip.findUniqueOrThrow({ where: { id: trip.id } })).resolves.toMatchObject({ status: "CANCELLED" });
  });

  it("active maintenance moves a vehicle into shop and completion restores availability", async () => {
    const actor = await createActor();
    const vehicle = await createAvailableVehicle(actor.id, "MH 12 TEST 0010");

    const maintenance = await createMaintenance(
      {
        vehicleId: vehicle.id,
        maintenanceType: "Oil Change",
        description: "Replace oil and filters",
        startDate: new Date(),
        cost: 0,
        odometerAtService: 1000,
        status: MaintenanceStatus.ACTIVE
      },
      actor.id
    );

    await expect(prisma.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } })).resolves.toMatchObject({ status: VehicleStatus.IN_SHOP });

    await completeMaintenance({ maintenanceId: maintenance.id, cost: 2500, completionDate: new Date() }, actor.id);
    await expect(prisma.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } })).resolves.toMatchObject({ status: VehicleStatus.AVAILABLE });
  });

  it("calculates fuel efficiency, operational cost, and ROI safely", () => {
    expect(calculateFuelEfficiency(500, 50)).toBe(10);
    expect(calculateFuelEfficiency(500, 0)).toBeNull();
    expect(calculateOperationalCost(1200, 800)).toBe(2000);
    expect(calculateVehicleRoi(100000, 10000, 5000, 500000)).toBe(17);
    expect(calculateVehicleRoi(100000, 10000, 5000, 0)).toBeNull();
  });
});

async function createActor() {
  return prisma.user.create({
    data: {
      name: "Test Admin",
      email: `admin-${Date.now()}-${Math.random()}@example.com`,
      passwordHash: actorPasswordHash,
      role: Role.ADMIN
    }
  });
}

function vehicleInput(registrationNumber: string, status: VehicleStatusValue = VehicleStatus.AVAILABLE, maxLoadCapacity = 1000) {
  return {
    registrationNumber,
    vehicleName: "Test Van",
    model: "Bolero",
    manufacturer: "Mahindra",
    vehicleType: "Cargo Van",
    maxLoadCapacity,
    currentOdometer: 1000,
    acquisitionCost: 800000,
    acquisitionDate: new Date("2024-01-01"),
    region: "West",
    status
  };
}

function driverInput(name: string, licenseNumber: string, status: DriverStatusValue = DriverStatus.AVAILABLE, expiryOffsetDays = 120) {
  return {
    name,
    email: `${licenseNumber.toLowerCase()}@example.com`,
    licenseNumber,
    licenseCategory: "LMV",
    licenseExpiryDate: new Date(Date.now() + expiryOffsetDays * 24 * 60 * 60 * 1000),
    contactNumber: "+91 98765 43210",
    safetyScore: 90,
    region: "West",
    status
  };
}

function tripInput(vehicleId: string, driverId: string) {
  return {
    source: "Mumbai",
    destination: "Pune",
    region: "West",
    vehicleId,
    driverId,
    cargoWeight: 400,
    plannedDistance: 160,
    revenue: 18000,
    plannedStartDate: new Date()
  };
}

async function createAvailableVehicle(actorId: string, registrationNumber: string, maxLoadCapacity = 1000) {
  return createVehicle(vehicleInput(registrationNumber, VehicleStatus.AVAILABLE, maxLoadCapacity), actorId);
}

async function createAvailableDriver(actorId: string, licenseNumber = "LIC-1") {
  return createDriver(driverInput("Available Driver", licenseNumber), actorId);
}
