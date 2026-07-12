import { asNumber } from "@/lib/utils";

export function calculateFuelEfficiency(distanceTravelled: unknown, fuelConsumed: unknown) {
  const distance = asNumber(distanceTravelled);
  const fuel = asNumber(fuelConsumed);

  if (distance <= 0 || fuel <= 0) {
    return null;
  }

  return distance / fuel;
}

export function calculateFleetUtilization(vehiclesOnTrip: unknown, totalActiveNonRetiredVehicles: unknown) {
  const onTrip = asNumber(vehiclesOnTrip);
  const totalActive = asNumber(totalActiveNonRetiredVehicles);

  if (totalActive <= 0) {
    return 0;
  }

  return (onTrip / totalActive) * 100;
}

export function calculateOperationalCost(fuelCost: unknown, maintenanceCost: unknown) {
  return asNumber(fuelCost) + asNumber(maintenanceCost);
}

export function calculateVehicleRoi(
  revenue: unknown,
  maintenanceCost: unknown,
  fuelCost: unknown,
  acquisitionCost: unknown
) {
  const acquisition = asNumber(acquisitionCost);

  if (acquisition <= 0) {
    return null;
  }

  return ((asNumber(revenue) - (asNumber(maintenanceCost) + asNumber(fuelCost))) / acquisition) * 100;
}

export function calculateCostPerKilometer(cost: unknown, distance: unknown) {
  const km = asNumber(distance);
  if (km <= 0) {
    return null;
  }
  return asNumber(cost) / km;
}
