export const Role = {
  ADMIN: "ADMIN",
  FLEET_MANAGER: "FLEET_MANAGER",
  DISPATCHER: "DISPATCHER",
  SAFETY_OFFICER: "SAFETY_OFFICER",
  FINANCIAL_ANALYST: "FINANCIAL_ANALYST"
} as const;

export type Role = (typeof Role)[keyof typeof Role];
export const roles = Object.values(Role) as [Role, ...Role[]];

export const VehicleStatus = {
  AVAILABLE: "AVAILABLE",
  ON_TRIP: "ON_TRIP",
  IN_SHOP: "IN_SHOP",
  RETIRED: "RETIRED"
} as const;

export type VehicleStatus = (typeof VehicleStatus)[keyof typeof VehicleStatus];
export const vehicleStatuses = Object.values(VehicleStatus) as [VehicleStatus, ...VehicleStatus[]];

export const DriverStatus = {
  AVAILABLE: "AVAILABLE",
  ON_TRIP: "ON_TRIP",
  OFF_DUTY: "OFF_DUTY",
  SUSPENDED: "SUSPENDED"
} as const;

export type DriverStatus = (typeof DriverStatus)[keyof typeof DriverStatus];
export const driverStatuses = Object.values(DriverStatus) as [DriverStatus, ...DriverStatus[]];

export const TripStatus = {
  DRAFT: "DRAFT",
  DISPATCHED: "DISPATCHED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED"
} as const;

export type TripStatus = (typeof TripStatus)[keyof typeof TripStatus];
export const tripStatuses = Object.values(TripStatus) as [TripStatus, ...TripStatus[]];

export const MaintenanceStatus = {
  SCHEDULED: "SCHEDULED",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED"
} as const;

export type MaintenanceStatus = (typeof MaintenanceStatus)[keyof typeof MaintenanceStatus];
export const maintenanceStatuses = Object.values(MaintenanceStatus) as [MaintenanceStatus, ...MaintenanceStatus[]];

export const ExpenseCategory = {
  FUEL: "FUEL",
  MAINTENANCE: "MAINTENANCE",
  TOLL: "TOLL",
  PARKING: "PARKING",
  INSURANCE: "INSURANCE",
  FINE: "FINE",
  REPAIR: "REPAIR",
  OTHER: "OTHER"
} as const;

export type ExpenseCategory = (typeof ExpenseCategory)[keyof typeof ExpenseCategory];
export const expenseCategories = Object.values(ExpenseCategory) as [ExpenseCategory, ...ExpenseCategory[]];

export const NotificationType = {
  DRIVER_LICENSE_EXPIRING: "DRIVER_LICENSE_EXPIRING",
  DRIVER_LICENSE_EXPIRED: "DRIVER_LICENSE_EXPIRED",
  MAINTENANCE_DUE: "MAINTENANCE_DUE",
  MAINTENANCE_OVERDUE: "MAINTENANCE_OVERDUE",
  VEHICLE_MAINTENANCE: "VEHICLE_MAINTENANCE",
  TRIP_DISPATCHED: "TRIP_DISPATCHED",
  TRIP_COMPLETED: "TRIP_COMPLETED"
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
export const notificationTypes = Object.values(NotificationType) as [NotificationType, ...NotificationType[]];

export function labelize(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}
