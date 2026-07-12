PRAGMA foreign_keys=OFF;

DROP TABLE IF EXISTS "Notification";
DROP TABLE IF EXISTS "ActivityLog";
DROP TABLE IF EXISTS "Expense";
DROP TABLE IF EXISTS "FuelLog";
DROP TABLE IF EXISTS "MaintenanceLog";
DROP TABLE IF EXISTS "Trip";
DROP TABLE IF EXISTS "Driver";
DROP TABLE IF EXISTS "Vehicle";
DROP TABLE IF EXISTS "User";

PRAGMA foreign_keys=ON;

CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "Vehicle" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "registrationNumber" TEXT NOT NULL,
  "vehicleName" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "manufacturer" TEXT NOT NULL,
  "vehicleType" TEXT NOT NULL,
  "maxLoadCapacity" DECIMAL NOT NULL,
  "currentOdometer" INTEGER NOT NULL,
  "acquisitionCost" DECIMAL NOT NULL,
  "acquisitionDate" DATETIME NOT NULL,
  "region" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "Driver" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "licenseNumber" TEXT NOT NULL,
  "licenseCategory" TEXT NOT NULL,
  "licenseExpiryDate" DATETIME NOT NULL,
  "contactNumber" TEXT NOT NULL,
  "safetyScore" INTEGER NOT NULL,
  "region" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "Trip" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tripNumber" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "driverId" TEXT NOT NULL,
  "cargoWeight" DECIMAL NOT NULL,
  "plannedDistance" DECIMAL NOT NULL,
  "actualDistance" DECIMAL,
  "startOdometer" INTEGER,
  "finalOdometer" INTEGER,
  "fuelConsumed" DECIMAL,
  "revenue" DECIMAL NOT NULL,
  "plannedStartDate" DATETIME NOT NULL,
  "actualStartDate" DATETIME,
  "completionDate" DATETIME,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Trip_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Trip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "MaintenanceLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "vehicleId" TEXT NOT NULL,
  "maintenanceType" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "startDate" DATETIME NOT NULL,
  "completionDate" DATETIME,
  "cost" DECIMAL NOT NULL DEFAULT 0,
  "odometerAtService" INTEGER NOT NULL,
  "serviceProvider" TEXT,
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "MaintenanceLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "FuelLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "vehicleId" TEXT NOT NULL,
  "tripId" TEXT,
  "date" DATETIME NOT NULL,
  "liters" DECIMAL NOT NULL,
  "totalCost" DECIMAL NOT NULL,
  "pricePerLiter" DECIMAL NOT NULL,
  "odometer" INTEGER NOT NULL,
  "fuelStation" TEXT,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "FuelLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "FuelLog_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Expense" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "vehicleId" TEXT NOT NULL,
  "tripId" TEXT,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DECIMAL NOT NULL,
  "date" DATETIME NOT NULL,
  "receiptReference" TEXT,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Expense_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Expense_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "ActivityLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "metadata" TEXT,
  "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "readAt" DATETIME,
  "entityType" TEXT,
  "entityId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "User_email_key" ON "User" ("email");
CREATE INDEX "User_role_idx" ON "User" ("role");

CREATE UNIQUE INDEX "Vehicle_registrationNumber_key" ON "Vehicle" ("registrationNumber");
CREATE INDEX "Vehicle_status_idx" ON "Vehicle" ("status");
CREATE INDEX "Vehicle_registrationNumber_idx" ON "Vehicle" ("registrationNumber");
CREATE INDEX "Vehicle_vehicleType_idx" ON "Vehicle" ("vehicleType");
CREATE INDEX "Vehicle_region_idx" ON "Vehicle" ("region");

CREATE UNIQUE INDEX "Driver_licenseNumber_key" ON "Driver" ("licenseNumber");
CREATE INDEX "Driver_status_idx" ON "Driver" ("status");
CREATE INDEX "Driver_licenseNumber_idx" ON "Driver" ("licenseNumber");
CREATE INDEX "Driver_licenseExpiryDate_idx" ON "Driver" ("licenseExpiryDate");
CREATE INDEX "Driver_region_idx" ON "Driver" ("region");

CREATE UNIQUE INDEX "Trip_tripNumber_key" ON "Trip" ("tripNumber");
CREATE INDEX "Trip_status_idx" ON "Trip" ("status");
CREATE INDEX "Trip_tripNumber_idx" ON "Trip" ("tripNumber");
CREATE INDEX "Trip_plannedStartDate_idx" ON "Trip" ("plannedStartDate");
CREATE INDEX "Trip_vehicleId_idx" ON "Trip" ("vehicleId");
CREATE INDEX "Trip_driverId_idx" ON "Trip" ("driverId");
CREATE INDEX "Trip_region_idx" ON "Trip" ("region");

CREATE INDEX "MaintenanceLog_status_idx" ON "MaintenanceLog" ("status");
CREATE INDEX "MaintenanceLog_startDate_idx" ON "MaintenanceLog" ("startDate");
CREATE INDEX "MaintenanceLog_vehicleId_idx" ON "MaintenanceLog" ("vehicleId");

CREATE INDEX "FuelLog_date_idx" ON "FuelLog" ("date");
CREATE INDEX "FuelLog_vehicleId_idx" ON "FuelLog" ("vehicleId");
CREATE INDEX "FuelLog_tripId_idx" ON "FuelLog" ("tripId");

CREATE INDEX "Expense_date_idx" ON "Expense" ("date");
CREATE INDEX "Expense_category_idx" ON "Expense" ("category");
CREATE INDEX "Expense_vehicleId_idx" ON "Expense" ("vehicleId");
CREATE INDEX "Expense_tripId_idx" ON "Expense" ("tripId");

CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog" ("action");
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog" ("entityType", "entityId");
CREATE INDEX "ActivityLog_timestamp_idx" ON "ActivityLog" ("timestamp");
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog" ("userId");

CREATE INDEX "Notification_readAt_idx" ON "Notification" ("readAt");
CREATE INDEX "Notification_type_idx" ON "Notification" ("type");
CREATE INDEX "Notification_createdAt_idx" ON "Notification" ("createdAt");
CREATE INDEX "Notification_userId_idx" ON "Notification" ("userId");
