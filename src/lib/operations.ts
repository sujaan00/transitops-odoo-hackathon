import { Prisma, PrismaClient } from "@prisma/client";
import { format } from "date-fns";
import bcrypt from "bcryptjs";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import {
  completeMaintenanceSchema,
  completeTripSchema,
  driverSchema,
  expenseSchema,
  fuelLogSchema,
  maintenanceSchema,
  tripSchema,
  userSchema,
  vehicleSchema
} from "@/lib/validations";
import { normalizeRegistration, normalizeText, asNumber } from "@/lib/utils";
import { DriverStatus, MaintenanceStatus, NotificationType, TripStatus, VehicleStatus } from "@/lib/domain";

type RootDb = PrismaClient;
type TxDb = Prisma.TransactionClient;
type Db = RootDb | TxDb;

async function createActivity(db: Db, input: {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: string;
}) {
  return db.activityLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      description: input.description,
      metadata: input.metadata
    }
  });
}

async function createNotification(db: Db, input: {
  userId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}) {
  return db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      entityType: input.entityType,
      entityId: input.entityId
    }
  });
}

function assertPrismaRoot(db: Db): RootDb {
  if (!("$transaction" in db)) {
    throw new AppError("This operation must be started from a database client.", "SERVER_ERROR", 500);
  }
  return db as RootDb;
}

function formatCapacity(value: unknown) {
  return `${asNumber(value).toLocaleString("en-IN", { maximumFractionDigits: 1 })} kg`;
}

async function ensureTripEligibility(db: Db, input: { vehicleId: string; driverId: string; cargoWeight: number }) {
  const [vehicle, driver] = await Promise.all([
    db.vehicle.findUnique({ where: { id: input.vehicleId } }),
    db.driver.findUnique({ where: { id: input.driverId } })
  ]);

  if (!vehicle) {
    throw new AppError("Selected vehicle does not exist.", "VEHICLE_NOT_FOUND", 404);
  }

  if (!driver) {
    throw new AppError("Selected driver does not exist.", "DRIVER_NOT_FOUND", 404);
  }

  if (vehicle.status === VehicleStatus.RETIRED) {
    throw new AppError("Retired vehicles cannot be dispatched.", "VEHICLE_RETIRED");
  }

  if (vehicle.status === VehicleStatus.IN_SHOP) {
    throw new AppError("This vehicle is currently undergoing maintenance.", "VEHICLE_IN_SHOP");
  }

  if (vehicle.status === VehicleStatus.ON_TRIP) {
    throw new AppError("This vehicle is already assigned to an active trip.", "VEHICLE_ON_TRIP");
  }

  if (vehicle.status !== VehicleStatus.AVAILABLE) {
    throw new AppError("This vehicle is no longer available.", "VEHICLE_UNAVAILABLE");
  }

  if (driver.status === DriverStatus.SUSPENDED) {
    throw new AppError("Suspended drivers cannot be assigned to trips.", "DRIVER_SUSPENDED");
  }

  if (driver.status === DriverStatus.ON_TRIP) {
    throw new AppError("This driver is already assigned to an active trip.", "DRIVER_ON_TRIP");
  }

  if (driver.status !== DriverStatus.AVAILABLE) {
    throw new AppError("This driver is not available for dispatch.", "DRIVER_UNAVAILABLE");
  }

  if (driver.licenseExpiryDate < new Date()) {
    throw new AppError("This driver's license has expired.", "DRIVER_LICENSE_EXPIRED");
  }

  if (input.cargoWeight > asNumber(vehicle.maxLoadCapacity)) {
    throw new AppError(
      `Cargo weight exceeds this vehicle's ${formatCapacity(vehicle.maxLoadCapacity)} capacity.`,
      "CARGO_OVER_CAPACITY"
    );
  }

  return { vehicle, driver };
}

async function nextTripNumber(db: Db) {
  const prefix = `TRP-${format(new Date(), "yyyyMMdd")}`;
  const count = await db.trip.count({
    where: {
      tripNumber: {
        startsWith: prefix
      }
    }
  });

  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

export async function createVehicle(input: unknown, actorId: string, db: Db = prisma) {
  const parsed = vehicleSchema.parse(input);

  try {
    const vehicle = await db.vehicle.create({
      data: {
        ...parsed,
        registrationNumber: normalizeRegistration(parsed.registrationNumber),
        vehicleName: normalizeText(parsed.vehicleName),
        model: normalizeText(parsed.model),
        manufacturer: normalizeText(parsed.manufacturer),
        vehicleType: normalizeText(parsed.vehicleType),
        region: normalizeText(parsed.region)
      }
    });

    await createActivity(db, {
      userId: actorId,
      action: "VEHICLE_CREATED",
      entityType: "Vehicle",
      entityId: vehicle.id,
      description: `${vehicle.vehicleName} (${vehicle.registrationNumber}) was added to the fleet.`
    });

    return vehicle;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("A vehicle with this registration number already exists.", "DUPLICATE_REGISTRATION", 409);
    }
    throw error;
  }
}

export async function createDriver(input: unknown, actorId: string, db: Db = prisma) {
  const parsed = driverSchema.parse(input);

  try {
    const driver = await db.driver.create({
      data: {
        ...parsed,
        name: normalizeText(parsed.name),
        email: parsed.email ? parsed.email.toLowerCase() : null,
        licenseNumber: normalizeRegistration(parsed.licenseNumber),
        licenseCategory: normalizeText(parsed.licenseCategory),
        contactNumber: normalizeText(parsed.contactNumber),
        region: normalizeText(parsed.region)
      }
    });

    await createActivity(db, {
      userId: actorId,
      action: "DRIVER_CREATED",
      entityType: "Driver",
      entityId: driver.id,
      description: `${driver.name} was added to the driver roster.`
    });

    return driver;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("A driver with this license number already exists.", "DUPLICATE_LICENSE", 409);
    }
    throw error;
  }
}

export async function createTrip(input: unknown, actorId: string, db: Db = prisma) {
  const parsed = tripSchema.parse(input);
  await ensureTripEligibility(db, {
    vehicleId: parsed.vehicleId,
    driverId: parsed.driverId,
    cargoWeight: parsed.cargoWeight
  });

  const trip = await db.trip.create({
    data: {
      ...parsed,
      source: normalizeText(parsed.source),
      destination: normalizeText(parsed.destination),
      region: normalizeText(parsed.region),
      tripNumber: await nextTripNumber(db)
    },
    include: {
      vehicle: true,
      driver: true
    }
  });

  await createActivity(db, {
    userId: actorId,
    action: "TRIP_CREATED",
    entityType: "Trip",
    entityId: trip.id,
    description: `${trip.tripNumber} was created for ${trip.source} to ${trip.destination}.`
  });

  return trip;
}

export async function dispatchTrip(tripId: string, actorId: string, db: Db = prisma) {
  return assertPrismaRoot(db).$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: { vehicle: true, driver: true }
    });

    if (!trip) {
      throw new AppError("Trip not found.", "TRIP_NOT_FOUND", 404);
    }

    if (trip.status !== TripStatus.DRAFT) {
      throw new AppError("Only draft trips can be dispatched.", "TRIP_NOT_DISPATCHABLE");
    }

    await ensureTripEligibility(tx, {
      vehicleId: trip.vehicleId,
      driverId: trip.driverId,
      cargoWeight: asNumber(trip.cargoWeight)
    });

    const vehicleUpdate = await tx.vehicle.updateMany({
      where: { id: trip.vehicleId, status: VehicleStatus.AVAILABLE },
      data: { status: VehicleStatus.ON_TRIP }
    });

    if (vehicleUpdate.count !== 1) {
      throw new AppError("This vehicle is no longer available.", "VEHICLE_UNAVAILABLE", 409);
    }

    const driverUpdate = await tx.driver.updateMany({
      where: { id: trip.driverId, status: DriverStatus.AVAILABLE },
      data: { status: DriverStatus.ON_TRIP }
    });

    if (driverUpdate.count !== 1) {
      throw new AppError("This driver is no longer available.", "DRIVER_UNAVAILABLE", 409);
    }

    const updatedTrip = await tx.trip.update({
      where: { id: trip.id },
      data: {
        status: TripStatus.DISPATCHED,
        actualStartDate: new Date(),
        startOdometer: trip.startOdometer ?? trip.vehicle.currentOdometer
      },
      include: { vehicle: true, driver: true }
    });

    await createActivity(tx, {
      userId: actorId,
      action: "TRIP_DISPATCHED",
      entityType: "Trip",
      entityId: updatedTrip.id,
      description: `${updatedTrip.tripNumber} was dispatched with ${updatedTrip.vehicle.registrationNumber} and ${updatedTrip.driver.name}.`
    });

    await createNotification(tx, {
      type: NotificationType.TRIP_DISPATCHED,
      title: "Trip dispatched",
      message: `${updatedTrip.tripNumber} is now on the road.`,
      entityType: "Trip",
      entityId: updatedTrip.id
    });

    return updatedTrip;
  });
}

export async function completeTrip(input: unknown, actorId: string, db: Db = prisma) {
  const parsed = completeTripSchema.parse(input);

  return assertPrismaRoot(db).$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: { id: parsed.tripId },
      include: { vehicle: true, driver: true }
    });

    if (!trip) {
      throw new AppError("Trip not found.", "TRIP_NOT_FOUND", 404);
    }

    if (trip.status !== TripStatus.DISPATCHED) {
      throw new AppError("Only dispatched trips can be completed.", "TRIP_NOT_COMPLETABLE");
    }

    const startOdometer = trip.startOdometer ?? trip.vehicle.currentOdometer;
    if (parsed.finalOdometer <= startOdometer) {
      throw new AppError("Final odometer must be greater than the trip start odometer.", "INVALID_ODOMETER");
    }

    const actualDistance = parsed.finalOdometer - startOdometer;
    const fuelConsumed = parsed.fuelConsumed ?? 0;
    const fuelCost = parsed.fuelCost ?? 0;

    const updatedTrip = await tx.trip.update({
      where: { id: trip.id },
      data: {
        status: TripStatus.COMPLETED,
        actualDistance,
        finalOdometer: parsed.finalOdometer,
        fuelConsumed,
        completionDate: new Date()
      },
      include: { vehicle: true, driver: true }
    });

    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: {
        status: VehicleStatus.AVAILABLE,
        currentOdometer: parsed.finalOdometer
      }
    });

    await tx.driver.update({
      where: { id: trip.driverId },
      data: { status: DriverStatus.AVAILABLE }
    });

    if (fuelConsumed > 0) {
      await tx.fuelLog.create({
        data: {
          vehicleId: trip.vehicleId,
          tripId: trip.id,
          date: new Date(),
          liters: fuelConsumed,
          totalCost: fuelCost,
          pricePerLiter: fuelCost > 0 ? fuelCost / fuelConsumed : 0,
          odometer: parsed.finalOdometer,
          fuelStation: parsed.fuelStation || "Recorded at trip close",
          notes: "Auto-created when the trip was completed."
        }
      });
    }

    await createActivity(tx, {
      userId: actorId,
      action: "TRIP_COMPLETED",
      entityType: "Trip",
      entityId: updatedTrip.id,
      description: `${updatedTrip.tripNumber} was completed after ${actualDistance.toLocaleString("en-IN")} km.`
    });

    await createNotification(tx, {
      type: NotificationType.TRIP_COMPLETED,
      title: "Trip completed",
      message: `${updatedTrip.tripNumber} has been completed.`,
      entityType: "Trip",
      entityId: updatedTrip.id
    });

    return updatedTrip;
  });
}

export async function cancelTrip(tripId: string, actorId: string, db: Db = prisma) {
  return assertPrismaRoot(db).$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: { vehicle: true, driver: true }
    });

    if (!trip) {
      throw new AppError("Trip not found.", "TRIP_NOT_FOUND", 404);
    }

    if (trip.status === TripStatus.COMPLETED) {
      throw new AppError("Completed trips cannot be cancelled.", "TRIP_COMPLETED");
    }

    if (trip.status === TripStatus.CANCELLED) {
      return trip;
    }

    const updatedTrip = await tx.trip.update({
      where: { id: trip.id },
      data: { status: TripStatus.CANCELLED },
      include: { vehicle: true, driver: true }
    });

    if (trip.status === TripStatus.DISPATCHED) {
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: VehicleStatus.AVAILABLE }
      });

      await tx.driver.update({
        where: { id: trip.driverId },
        data: { status: DriverStatus.AVAILABLE }
      });
    }

    await createActivity(tx, {
      userId: actorId,
      action: "TRIP_CANCELLED",
      entityType: "Trip",
      entityId: updatedTrip.id,
      description: `${updatedTrip.tripNumber} was cancelled.`
    });

    return updatedTrip;
  });
}

export async function createMaintenance(input: unknown, actorId: string, db: Db = prisma) {
  const parsed = maintenanceSchema.parse(input);

  return assertPrismaRoot(db).$transaction(async (tx) => {
    const vehicle = await tx.vehicle.findUnique({ where: { id: parsed.vehicleId } });

    if (!vehicle) {
      throw new AppError("Vehicle not found.", "VEHICLE_NOT_FOUND", 404);
    }

    if (parsed.status === MaintenanceStatus.ACTIVE) {
      if (vehicle.status === VehicleStatus.RETIRED) {
        throw new AppError("Retired vehicles cannot be moved into active maintenance.", "VEHICLE_RETIRED");
      }

      if (vehicle.status === VehicleStatus.ON_TRIP) {
        throw new AppError("Vehicles on active trips cannot be moved into maintenance.", "VEHICLE_ON_TRIP");
      }

      if (vehicle.status === VehicleStatus.IN_SHOP) {
        throw new AppError("This vehicle is already undergoing maintenance.", "VEHICLE_IN_SHOP");
      }
    }

    const maintenance = await tx.maintenanceLog.create({
      data: {
        ...parsed,
        serviceProvider: parsed.serviceProvider || null,
        notes: parsed.notes || null
      },
      include: { vehicle: true }
    });

    if (parsed.status === MaintenanceStatus.ACTIVE) {
      const update = await tx.vehicle.updateMany({
        where: { id: parsed.vehicleId, status: VehicleStatus.AVAILABLE },
        data: { status: VehicleStatus.IN_SHOP }
      });

      if (update.count !== 1) {
        throw new AppError("This vehicle is no longer available for maintenance.", "VEHICLE_UNAVAILABLE", 409);
      }

      await createNotification(tx, {
        type: NotificationType.VEHICLE_MAINTENANCE,
        title: "Vehicle in maintenance",
        message: `${maintenance.vehicle.registrationNumber} has entered active maintenance.`,
        entityType: "MaintenanceLog",
        entityId: maintenance.id
      });
    }

    await createActivity(tx, {
      userId: actorId,
      action: parsed.status === MaintenanceStatus.ACTIVE ? "MAINTENANCE_STARTED" : "MAINTENANCE_SCHEDULED",
      entityType: "MaintenanceLog",
      entityId: maintenance.id,
      description: `${maintenance.maintenanceType} was ${parsed.status === MaintenanceStatus.ACTIVE ? "started" : "scheduled"} for ${maintenance.vehicle.registrationNumber}.`
    });

    return maintenance;
  });
}

export async function completeMaintenance(input: unknown, actorId: string, db: Db = prisma) {
  const parsed = completeMaintenanceSchema.parse(input);

  return assertPrismaRoot(db).$transaction(async (tx) => {
    const maintenance = await tx.maintenanceLog.findUnique({
      where: { id: parsed.maintenanceId },
      include: { vehicle: true }
    });

    if (!maintenance) {
      throw new AppError("Maintenance record not found.", "MAINTENANCE_NOT_FOUND", 404);
    }

    if (maintenance.status === MaintenanceStatus.COMPLETED) {
      return maintenance;
    }

    if (maintenance.status === MaintenanceStatus.CANCELLED) {
      throw new AppError("Cancelled maintenance cannot be completed.", "MAINTENANCE_CANCELLED");
    }

    const updated = await tx.maintenanceLog.update({
      where: { id: maintenance.id },
      data: {
        status: MaintenanceStatus.COMPLETED,
        completionDate: parsed.completionDate,
        cost: parsed.cost,
        notes: parsed.notes ?? maintenance.notes
      },
      include: { vehicle: true }
    });

    if (maintenance.vehicle.status === VehicleStatus.IN_SHOP) {
      await tx.vehicle.update({
        where: { id: maintenance.vehicleId },
        data: { status: VehicleStatus.AVAILABLE }
      });
    }

    await createActivity(tx, {
      userId: actorId,
      action: "MAINTENANCE_COMPLETED",
      entityType: "MaintenanceLog",
      entityId: updated.id,
      description: `${updated.maintenanceType} was completed for ${updated.vehicle.registrationNumber}.`
    });

    return updated;
  });
}

export async function createFuelLog(input: unknown, actorId: string, db: Db = prisma) {
  const parsed = fuelLogSchema.parse(input);
  const vehicle = await db.vehicle.findUnique({ where: { id: parsed.vehicleId } });

  if (!vehicle) {
    throw new AppError("Vehicle not found.", "VEHICLE_NOT_FOUND", 404);
  }

  if (parsed.odometer < vehicle.currentOdometer) {
    throw new AppError("Fuel odometer cannot be lower than the vehicle's current odometer.", "INVALID_ODOMETER");
  }

  const fuelLog = await db.fuelLog.create({
    data: {
      ...parsed,
      tripId: parsed.tripId || null,
      pricePerLiter: parsed.totalCost / parsed.liters,
      fuelStation: parsed.fuelStation || null,
      notes: parsed.notes || null
    },
    include: { vehicle: true, trip: true }
  });

  await createActivity(db, {
    userId: actorId,
    action: "FUEL_LOG_ADDED",
    entityType: "FuelLog",
    entityId: fuelLog.id,
    description: `${fuelLog.liters.toString()} L fuel log added for ${fuelLog.vehicle.registrationNumber}.`
  });

  return fuelLog;
}

export async function createExpense(input: unknown, actorId: string, db: Db = prisma) {
  const parsed = expenseSchema.parse(input);
  const vehicle = await db.vehicle.findUnique({ where: { id: parsed.vehicleId } });

  if (!vehicle) {
    throw new AppError("Vehicle not found.", "VEHICLE_NOT_FOUND", 404);
  }

  const expense = await db.expense.create({
    data: {
      ...parsed,
      tripId: parsed.tripId || null,
      receiptReference: parsed.receiptReference || null,
      notes: parsed.notes || null
    },
    include: { vehicle: true, trip: true }
  });

  await createActivity(db, {
    userId: actorId,
    action: "EXPENSE_ADDED",
    entityType: "Expense",
    entityId: expense.id,
    description: `${expense.category} expense recorded for ${expense.vehicle.registrationNumber}.`
  });

  return expense;
}

export async function createUser(input: unknown, actorId: string, db: Db = prisma) {
  const parsed = userSchema.parse(input);

  try {
    const user = await db.user.create({
      data: {
        name: normalizeText(parsed.name),
        email: parsed.email.toLowerCase(),
        role: parsed.role,
        passwordHash: await bcrypt.hash(parsed.password, 12)
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    await createActivity(db, {
      userId: actorId,
      action: "USER_CREATED",
      entityType: "User",
      entityId: user.id,
      description: `${user.name} was invited as ${user.role}.`
    });

    return user;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("A user with this email already exists.", "DUPLICATE_EMAIL", 409);
    }
    throw error;
  }
}
