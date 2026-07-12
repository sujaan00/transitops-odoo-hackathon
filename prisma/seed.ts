import { PrismaClient } from "@prisma/client";
import { addDays, subDays } from "date-fns";
import bcrypt from "bcryptjs";
import {
  DriverStatus,
  ExpenseCategory,
  MaintenanceStatus,
  NotificationType,
  Role,
  TripStatus,
  VehicleStatus,
  type DriverStatus as DriverStatusValue,
  type ExpenseCategory as ExpenseCategoryValue,
  type VehicleStatus as VehicleStatusValue
} from "../src/lib/domain";

const prisma = new PrismaClient();
const password = "TransitOps@123";

async function main() {
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(password, 12);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "Sujaan Keshri",
        email: "admin@transitops.local",
        passwordHash,
        role: Role.ADMIN
      }
    }),
    prisma.user.create({
      data: {
        name: "Ishita Rao",
        email: "fleet@transitops.local",
        passwordHash,
        role: Role.FLEET_MANAGER
      }
    }),
    prisma.user.create({
      data: {
        name: "Kabir Malhotra",
        email: "dispatcher@transitops.local",
        passwordHash,
        role: Role.DISPATCHER
      }
    }),
    prisma.user.create({
      data: {
        name: "Nisha Menon",
        email: "safety@transitops.local",
        passwordHash,
        role: Role.SAFETY_OFFICER
      }
    }),
    prisma.user.create({
      data: {
        name: "Rohan Iyer",
        email: "finance@transitops.local",
        passwordHash,
        role: Role.FINANCIAL_ANALYST
      }
    })
  ]);

  const admin = users[0];

  const vehicles = await Promise.all([
    createVehicle("MH 12 AB 4581", "Pune Reefer 01", "Prima 2528.K", "Tata", "Refrigerated Truck", 8500, 78420, 3450000, "West", VehicleStatus.ON_TRIP),
    createVehicle("KA 05 MN 9012", "Bengaluru Van 05", "Bolero Maxitruck", "Mahindra", "Cargo Van", 500, 21880, 820000, "South", VehicleStatus.ON_TRIP),
    createVehicle("DL 01 CX 7734", "Delhi Container 02", "Pro 6042", "Eicher", "Container Truck", 16000, 112300, 4200000, "North", VehicleStatus.AVAILABLE),
    createVehicle("TN 10 QW 1479", "Chennai Flatbed 03", "Blazo X 35", "Mahindra", "Flatbed", 18000, 93610, 3900000, "South", VehicleStatus.AVAILABLE),
    createVehicle("GJ 18 TR 6240", "Ahmedabad Tanker 02", "Signa 4018.S", "Tata", "Tanker", 14000, 148220, 4550000, "West", VehicleStatus.AVAILABLE),
    createVehicle("RJ 14 PL 8801", "Jaipur Box 04", "Boss 1215", "Ashok Leyland", "Box Truck", 7200, 67450, 2400000, "North", VehicleStatus.AVAILABLE),
    createVehicle("WB 19 AD 3510", "Kolkata Reefer 03", "Pro 3019", "Eicher", "Refrigerated Truck", 9000, 58710, 3300000, "East", VehicleStatus.AVAILABLE),
    createVehicle("TS 09 HU 5122", "Hyderabad Mini 07", "Dost+", "Ashok Leyland", "Mini Truck", 1250, 39120, 910000, "South", VehicleStatus.AVAILABLE),
    createVehicle("UP 32 KT 1933", "Lucknow Container 01", "LPT 1618", "Tata", "Container Truck", 12000, 104800, 3100000, "North", VehicleStatus.IN_SHOP),
    createVehicle("HR 55 BC 7391", "Gurugram Van 08", "Supro Profit", "Mahindra", "Cargo Van", 850, 33780, 760000, "North", VehicleStatus.IN_SHOP),
    createVehicle("MH 46 JK 6907", "Navi Mumbai Trailer 01", "U-Truck", "BharatBenz", "Trailer", 22000, 186400, 5200000, "West", VehicleStatus.RETIRED),
    createVehicle("KL 07 EE 2198", "Kochi Box 06", "Partner 6 Tyre", "Ashok Leyland", "Box Truck", 5800, 76100, 1980000, "South", VehicleStatus.AVAILABLE),
    createVehicle("MP 09 VN 6021", "Indore Cargo 09", "Furio 12", "Mahindra", "Cargo Truck", 6500, 45310, 2150000, "Central", VehicleStatus.AVAILABLE),
    createVehicle("PB 10 GH 8224", "Ludhiana Flatbed 01", "Pro 2110", "Eicher", "Flatbed", 10200, 99200, 2650000, "North", VehicleStatus.AVAILABLE),
    createVehicle("OR 02 AX 3388", "Bhubaneswar Mini 02", "Ace Gold", "Tata", "Mini Truck", 750, 28200, 565000, "East", VehicleStatus.AVAILABLE),
    createVehicle("AS 01 DR 5482", "Guwahati Reefer 01", "Ultra 1918", "Tata", "Refrigerated Truck", 7800, 50400, 2860000, "East", VehicleStatus.AVAILABLE)
  ]);

  const drivers = await Promise.all([
    createDriver("Ramesh Patil", "ramesh.patil@example.com", "MH1420160004812", "HMV", 420, "West", DriverStatus.ON_TRIP, 91),
    createDriver("Ananya Shenoy", "ananya.shenoy@example.com", "KA0520190045719", "LMV", 730, "South", DriverStatus.ON_TRIP, 94),
    createDriver("Harpreet Singh", "harpreet.singh@example.com", "DL0120180087112", "HMV", 180, "North", DriverStatus.AVAILABLE, 88),
    createDriver("Sanjay Yadav", "sanjay.yadav@example.com", "UP3220170042901", "HMV", 12, "North", DriverStatus.AVAILABLE, 80),
    createDriver("Meera Das", "meera.das@example.com", "WB1920200014523", "HMV", 365, "East", DriverStatus.AVAILABLE, 96),
    createDriver("Vikram Nair", "vikram.nair@example.com", "KL0720180078011", "LMV", 50, "South", DriverStatus.AVAILABLE, 83),
    createDriver("Imran Khan", "imran.khan@example.com", "GJ1820160051250", "HMV", -15, "West", DriverStatus.AVAILABLE, 79),
    createDriver("Priya Kulkarni", "priya.kulkarni@example.com", "MH4620210040882", "LMV", 220, "West", DriverStatus.OFF_DUTY, 90),
    createDriver("Naveen Reddy", "naveen.reddy@example.com", "TS0920190021881", "HMV", 640, "South", DriverStatus.SUSPENDED, 52),
    createDriver("Arjun Verma", "arjun.verma@example.com", "RJ1420180041012", "HMV", 305, "North", DriverStatus.AVAILABLE, 87),
    createDriver("Subhash Bora", "subhash.bora@example.com", "AS0120220064318", "HMV", 465, "East", DriverStatus.AVAILABLE, 89),
    createDriver("Kavita Sharma", "kavita.sharma@example.com", "PB1020200090311", "HMV", 95, "North", DriverStatus.AVAILABLE, 92)
  ]);

  const now = new Date();

  const dispatchedOne = await prisma.trip.create({
    data: {
      tripNumber: "TRP-20260712-0001",
      source: "Pune",
      destination: "Mumbai",
      region: "West",
      vehicleId: vehicles[0].id,
      driverId: drivers[0].id,
      cargoWeight: 7200,
      plannedDistance: 160,
      startOdometer: 78420,
      revenue: 52000,
      plannedStartDate: subDays(now, 1),
      actualStartDate: subDays(now, 1),
      status: TripStatus.DISPATCHED
    }
  });

  const dispatchedTwo = await prisma.trip.create({
    data: {
      tripNumber: "TRP-20260712-0002",
      source: "Bengaluru",
      destination: "Mysuru",
      region: "South",
      vehicleId: vehicles[1].id,
      driverId: drivers[1].id,
      cargoWeight: 450,
      plannedDistance: 145,
      startOdometer: 21880,
      revenue: 18000,
      plannedStartDate: now,
      actualStartDate: now,
      status: TripStatus.DISPATCHED
    }
  });

  const completedTrips = await Promise.all([
    prisma.trip.create({
      data: completedTrip("TRP-20260701-0007", "Delhi", "Jaipur", "North", vehicles[2].id, drivers[2].id, 8500, 281, 110900, 111186, 64, 72000, subDays(now, 11), subDays(now, 10))
    }),
    prisma.trip.create({
      data: completedTrip("TRP-20260702-0004", "Chennai", "Coimbatore", "South", vehicles[3].id, drivers[5].id, 12200, 505, 92940, 93452, 94, 98000, subDays(now, 9), subDays(now, 8))
    }),
    prisma.trip.create({
      data: completedTrip("TRP-20260703-0012", "Ahmedabad", "Surat", "West", vehicles[4].id, drivers[9].id, 9100, 265, 147720, 147990, 57, 64000, subDays(now, 7), subDays(now, 6))
    }),
    prisma.trip.create({
      data: completedTrip("TRP-20260706-0008", "Kolkata", "Bhubaneswar", "East", vehicles[6].id, drivers[4].id, 6900, 440, 58310, 58710, 78, 89000, subDays(now, 5), subDays(now, 4))
    })
  ]);

  await Promise.all([
    prisma.trip.create({
      data: {
        tripNumber: "TRP-20260714-0001",
        source: "Indore",
        destination: "Bhopal",
        region: "Central",
        vehicleId: vehicles[12].id,
        driverId: drivers[10].id,
        cargoWeight: 4100,
        plannedDistance: 195,
        revenue: 44000,
        plannedStartDate: addDays(now, 2),
        status: TripStatus.DRAFT
      }
    }),
    prisma.trip.create({
      data: {
        tripNumber: "TRP-20260715-0002",
        source: "Ludhiana",
        destination: "Chandigarh",
        region: "North",
        vehicleId: vehicles[13].id,
        driverId: drivers[11].id,
        cargoWeight: 7700,
        plannedDistance: 108,
        revenue: 31500,
        plannedStartDate: addDays(now, 3),
        status: TripStatus.DRAFT
      }
    }),
    prisma.trip.create({
      data: {
        tripNumber: "TRP-20260705-0009",
        source: "Kochi",
        destination: "Kozhikode",
        region: "South",
        vehicleId: vehicles[11].id,
        driverId: drivers[7].id,
        cargoWeight: 3100,
        plannedDistance: 182,
        revenue: 38500,
        plannedStartDate: subDays(now, 3),
        status: TripStatus.CANCELLED
      }
    })
  ]);

  await Promise.all([
    prisma.maintenanceLog.create({
      data: {
        vehicleId: vehicles[8].id,
        maintenanceType: "Brake Overhaul",
        description: "Brake lining replacement and compressor inspection.",
        startDate: subDays(now, 2),
        cost: 0,
        odometerAtService: 104800,
        serviceProvider: "Lucknow FleetCare",
        status: MaintenanceStatus.ACTIVE,
        notes: "Parts ordered, expected closure tomorrow."
      }
    }),
    prisma.maintenanceLog.create({
      data: {
        vehicleId: vehicles[9].id,
        maintenanceType: "Clutch Inspection",
        description: "Clutch pedal vibration reported during city deliveries.",
        startDate: subDays(now, 1),
        cost: 0,
        odometerAtService: 33780,
        serviceProvider: "NCR Auto Works",
        status: MaintenanceStatus.ACTIVE
      }
    }),
    prisma.maintenanceLog.create({
      data: {
        vehicleId: vehicles[4].id,
        maintenanceType: "Oil Change",
        description: "Scheduled engine oil and filter replacement.",
        startDate: addDays(now, 4),
        cost: 0,
        odometerAtService: 148220,
        serviceProvider: "Gujarat Highway Service",
        status: MaintenanceStatus.SCHEDULED
      }
    }),
    prisma.maintenanceLog.create({
      data: {
        vehicleId: vehicles[6].id,
        maintenanceType: "Reefer Calibration",
        description: "Temperature unit calibration and compressor cleaning.",
        startDate: subDays(now, 18),
        completionDate: subDays(now, 17),
        cost: 18400,
        odometerAtService: 57780,
        serviceProvider: "ColdLine Kolkata",
        status: MaintenanceStatus.COMPLETED,
        notes: "Calibration certificate uploaded by vendor."
      }
    })
  ]);

  await Promise.all([
    fuel(vehicles[2].id, completedTrips[0].id, subDays(now, 10), 64, 5952, 111186, "IOCL NH48 Jaipur"),
    fuel(vehicles[3].id, completedTrips[1].id, subDays(now, 8), 94, 8742, 93452, "BPCL Salem Road"),
    fuel(vehicles[4].id, completedTrips[2].id, subDays(now, 6), 57, 5301, 147990, "HPCL Surat Corridor"),
    fuel(vehicles[6].id, completedTrips[3].id, subDays(now, 4), 78, 7254, 58710, "IOCL Cuttack"),
    fuel(vehicles[0].id, dispatchedOne.id, subDays(now, 1), 38, 3534, 78420, "Shell Pune Bypass"),
    fuel(vehicles[1].id, dispatchedTwo.id, now, 18, 1674, 21880, "HPCL Kengeri")
  ]);

  await Promise.all([
    expense(vehicles[2].id, completedTrips[0].id, ExpenseCategory.TOLL, "Delhi-Jaipur toll cluster", 6400, subDays(now, 10)),
    expense(vehicles[3].id, completedTrips[1].id, ExpenseCategory.PARKING, "Overnight secure parking", 2200, subDays(now, 8)),
    expense(vehicles[6].id, completedTrips[3].id, ExpenseCategory.INSURANCE, "Monthly fleet insurance allocation", 12800, subDays(now, 4)),
    expense(vehicles[8].id, null, ExpenseCategory.REPAIR, "Brake kit advance", 36000, subDays(now, 1)),
    expense(vehicles[9].id, null, ExpenseCategory.REPAIR, "Clutch plate diagnostic deposit", 9500, now),
    expense(vehicles[13].id, null, ExpenseCategory.OTHER, "Permit renewal facilitation", 4800, subDays(now, 2))
  ]);

  await prisma.activityLog.createMany({
    data: [
      activity(admin.id, "TRIP_DISPATCHED", "Trip", dispatchedOne.id, "TRP-20260712-0001 was dispatched from Pune to Mumbai.", subDays(now, 1)),
      activity(admin.id, "TRIP_DISPATCHED", "Trip", dispatchedTwo.id, "TRP-20260712-0002 was dispatched from Bengaluru to Mysuru.", now),
      activity(admin.id, "MAINTENANCE_STARTED", "Vehicle", vehicles[8].id, "UP 32 KT 1933 moved into active brake maintenance.", subDays(now, 2)),
      activity(admin.id, "FUEL_LOG_ADDED", "Vehicle", vehicles[6].id, "Fuel log added for Kolkata Reefer 03.", subDays(now, 4)),
      activity(admin.id, "TRIP_COMPLETED", "Trip", completedTrips[3].id, "TRP-20260706-0008 was completed.", subDays(now, 4)),
      activity(admin.id, "DRIVER_UPDATED", "Driver", drivers[6].id, "Imran Khan's license is expired and needs renewal.", now)
    ]
  });

  await prisma.notification.createMany({
    data: [
      {
        type: NotificationType.DRIVER_LICENSE_EXPIRED,
        title: "Driver license expired",
        message: "Imran Khan's HMV license expired 15 days ago.",
        entityType: "Driver",
        entityId: drivers[6].id,
        createdAt: now
      },
      {
        type: NotificationType.DRIVER_LICENSE_EXPIRING,
        title: "License expiring soon",
        message: "Sanjay Yadav's license expires in 12 days.",
        entityType: "Driver",
        entityId: drivers[3].id,
        createdAt: now
      },
      {
        type: NotificationType.VEHICLE_MAINTENANCE,
        title: "Vehicle in maintenance",
        message: "UP 32 KT 1933 is unavailable while brake overhaul is active.",
        entityType: "Vehicle",
        entityId: vehicles[8].id,
        createdAt: subDays(now, 1)
      },
      {
        type: NotificationType.TRIP_DISPATCHED,
        title: "Trip dispatched",
        message: "TRP-20260712-0002 is now on the road.",
        entityType: "Trip",
        entityId: dispatchedTwo.id,
        createdAt: now
      }
    ]
  });

  console.log("TransitOps seed complete.");
  console.table(
    users.map((user) => ({
      email: user.email,
      password,
      role: user.role
    }))
  );
}

function createVehicle(
  registrationNumber: string,
  vehicleName: string,
  model: string,
  manufacturer: string,
  vehicleType: string,
  maxLoadCapacity: number,
  currentOdometer: number,
  acquisitionCost: number,
  region: string,
  status: VehicleStatusValue
) {
  return prisma.vehicle.create({
    data: {
      registrationNumber,
      vehicleName,
      model,
      manufacturer,
      vehicleType,
      maxLoadCapacity,
      currentOdometer,
      acquisitionCost,
      acquisitionDate: subDays(new Date(), 600 + Math.floor(Math.random() * 900)),
      region,
      status
    }
  });
}

function createDriver(
  name: string,
  email: string,
  licenseNumber: string,
  licenseCategory: string,
  expiryOffsetDays: number,
  region: string,
  status: DriverStatusValue,
  safetyScore: number
) {
  return prisma.driver.create({
    data: {
      name,
      email,
      licenseNumber,
      licenseCategory,
      licenseExpiryDate: addDays(new Date(), expiryOffsetDays),
      contactNumber: `+91 9${Math.floor(100000000 + Math.random() * 899999999)}`,
      safetyScore,
      region,
      status
    }
  });
}

function completedTrip(
  tripNumber: string,
  source: string,
  destination: string,
  region: string,
  vehicleId: string,
  driverId: string,
  cargoWeight: number,
  plannedDistance: number,
  startOdometer: number,
  finalOdometer: number,
  fuelConsumed: number,
  revenue: number,
  actualStartDate: Date,
  completionDate: Date
) {
  return {
    tripNumber,
    source,
    destination,
    region,
    vehicleId,
    driverId,
    cargoWeight,
    plannedDistance,
    actualDistance: finalOdometer - startOdometer,
    startOdometer,
    finalOdometer,
    fuelConsumed,
    revenue,
    plannedStartDate: actualStartDate,
    actualStartDate,
    completionDate,
    status: TripStatus.COMPLETED
  };
}

function fuel(vehicleId: string, tripId: string | null, date: Date, liters: number, totalCost: number, odometer: number, fuelStation: string) {
  return prisma.fuelLog.create({
    data: {
      vehicleId,
      tripId,
      date,
      liters,
      totalCost,
      pricePerLiter: totalCost / liters,
      odometer,
      fuelStation,
      notes: "Seeded operational fuel record."
    }
  });
}

function expense(vehicleId: string, tripId: string | null, category: ExpenseCategoryValue, description: string, amount: number, date: Date) {
  return prisma.expense.create({
    data: {
      vehicleId,
      tripId,
      category,
      description,
      amount,
      date,
      receiptReference: `RCPT-${Math.floor(10000 + Math.random() * 89999)}`,
      notes: "Seeded finance record."
    }
  });
}

function activity(userId: string, action: string, entityType: string, entityId: string, description: string, timestamp: Date) {
  return {
    userId,
    action,
    entityType,
    entityId,
    description,
    timestamp
  };
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
