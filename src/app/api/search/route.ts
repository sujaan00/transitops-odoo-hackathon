import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    await requireUser();
    const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

    if (query.length < 2) {
      return ok([]);
    }

    const [vehicles, drivers, trips] = await Promise.all([
      prisma.vehicle.findMany({
        where: {
          OR: [
            { registrationNumber: { contains: query } },
            { vehicleName: { contains: query } },
            { manufacturer: { contains: query } },
            { region: { contains: query } }
          ]
        },
        take: 5,
        orderBy: { updatedAt: "desc" }
      }),
      prisma.driver.findMany({
        where: {
          OR: [{ name: { contains: query } }, { licenseNumber: { contains: query } }, { region: { contains: query } }]
        },
        take: 5,
        orderBy: { updatedAt: "desc" }
      }),
      prisma.trip.findMany({
        where: {
          OR: [{ tripNumber: { contains: query } }, { source: { contains: query } }, { destination: { contains: query } }, { region: { contains: query } }]
        },
        take: 5,
        orderBy: { updatedAt: "desc" }
      })
    ]);

    return ok([
      ...vehicles.map((vehicle) => ({
        group: "Vehicles",
        id: vehicle.id,
        title: `${vehicle.registrationNumber} · ${vehicle.vehicleName}`,
        subtitle: `${vehicle.vehicleType} · ${vehicle.status} · ${vehicle.region}`,
        href: `/vehicles/${vehicle.id}`
      })),
      ...drivers.map((driver) => ({
        group: "Drivers",
        id: driver.id,
        title: driver.name,
        subtitle: `${driver.licenseCategory} · ${driver.status} · ${driver.region}`,
        href: `/drivers/${driver.id}`
      })),
      ...trips.map((trip) => ({
        group: "Trips",
        id: trip.id,
        title: trip.tripNumber,
        subtitle: `${trip.source} to ${trip.destination} · ${trip.status}`,
        href: `/trips/${trip.id}`
      }))
    ]);
  } catch (error) {
    return fail(error);
  }
}
