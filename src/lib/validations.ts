import { z } from "zod";
import {
  DriverStatus,
  MaintenanceStatus,
  VehicleStatus,
  driverStatuses,
  expenseCategories,
  maintenanceStatuses,
  roles,
  vehicleStatuses
} from "@/lib/domain";

const requiredString = (label: string) => z.string().trim().min(1, `${label} is required.`);
const positiveNumber = (label: string) => z.coerce.number({ invalid_type_error: `${label} must be a number.` }).positive(`${label} must be greater than zero.`);
const nonNegativeNumber = (label: string) => z.coerce.number({ invalid_type_error: `${label} must be a number.` }).min(0, `${label} cannot be negative.`);
const positiveInt = (label: string) => z.coerce.number().int(`${label} must be a whole number.`).min(0, `${label} cannot be negative.`);

export const vehicleSchema = z.object({
  registrationNumber: requiredString("Registration number").max(24),
  vehicleName: requiredString("Vehicle name").max(80),
  model: requiredString("Model").max(80),
  manufacturer: requiredString("Manufacturer").max(80),
  vehicleType: requiredString("Vehicle type").max(60),
  maxLoadCapacity: positiveNumber("Maximum load capacity"),
  currentOdometer: positiveInt("Current odometer"),
  acquisitionCost: nonNegativeNumber("Acquisition cost"),
  acquisitionDate: z.coerce.date({ invalid_type_error: "Acquisition date is required." }),
  region: requiredString("Region").max(80),
  status: z.enum(vehicleStatuses).default(VehicleStatus.AVAILABLE)
});

export const driverSchema = z.object({
  name: requiredString("Driver name").max(100),
  email: z.string().trim().email("Enter a valid email.").optional().or(z.literal("")),
  licenseNumber: requiredString("License number").max(40),
  licenseCategory: requiredString("License category").max(30),
  licenseExpiryDate: z.coerce.date({ invalid_type_error: "License expiry date is required." }),
  contactNumber: requiredString("Contact number").regex(/^[+0-9 -]{8,18}$/, "Enter a valid phone number."),
  safetyScore: z.coerce.number().int().min(0).max(100),
  region: requiredString("Region").max(80),
  status: z.enum(driverStatuses).default(DriverStatus.AVAILABLE)
});

export const tripSchema = z.object({
  source: requiredString("Source").max(100),
  destination: requiredString("Destination").max(100),
  region: requiredString("Region").max(80),
  vehicleId: requiredString("Vehicle"),
  driverId: requiredString("Driver"),
  cargoWeight: positiveNumber("Cargo weight"),
  plannedDistance: positiveNumber("Planned distance"),
  revenue: nonNegativeNumber("Revenue"),
  plannedStartDate: z.coerce.date({ invalid_type_error: "Planned start date is required." })
});

export const completeTripSchema = z.object({
  tripId: requiredString("Trip"),
  finalOdometer: positiveInt("Final odometer"),
  fuelConsumed: z.coerce.number().min(0, "Fuel consumed cannot be negative.").optional(),
  fuelCost: z.coerce.number().min(0, "Fuel cost cannot be negative.").optional(),
  fuelStation: z.string().trim().max(120).optional()
});

export const maintenanceSchema = z.object({
  vehicleId: requiredString("Vehicle"),
  maintenanceType: requiredString("Maintenance type").max(80),
  description: requiredString("Description").max(300),
  startDate: z.coerce.date({ invalid_type_error: "Start date is required." }),
  completionDate: z.coerce.date().optional().nullable(),
  cost: nonNegativeNumber("Cost").default(0),
  odometerAtService: positiveInt("Odometer at service"),
  serviceProvider: z.string().trim().max(120).optional().or(z.literal("")),
  status: z.enum(maintenanceStatuses).default(MaintenanceStatus.SCHEDULED),
  notes: z.string().trim().max(500).optional().or(z.literal(""))
});

export const completeMaintenanceSchema = z.object({
  maintenanceId: requiredString("Maintenance"),
  cost: nonNegativeNumber("Cost"),
  completionDate: z.coerce.date({ invalid_type_error: "Completion date is required." }),
  notes: z.string().trim().max(500).optional()
});

export const fuelLogSchema = z.object({
  vehicleId: requiredString("Vehicle"),
  tripId: z.string().trim().optional().or(z.literal("")),
  date: z.coerce.date({ invalid_type_error: "Date is required." }),
  liters: positiveNumber("Liters"),
  totalCost: positiveNumber("Total cost"),
  odometer: positiveInt("Odometer"),
  fuelStation: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal(""))
});

export const expenseSchema = z.object({
  vehicleId: requiredString("Vehicle"),
  tripId: z.string().trim().optional().or(z.literal("")),
  category: z.enum(expenseCategories),
  description: requiredString("Description").max(200),
  amount: positiveNumber("Amount"),
  date: z.coerce.date({ invalid_type_error: "Date is required." }),
  receiptReference: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal(""))
});

export const userSchema = z.object({
  name: requiredString("Name").max(100),
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(roles)
});

export const updateUserRoleSchema = z.object({
  userId: requiredString("User"),
  role: z.enum(roles)
});
