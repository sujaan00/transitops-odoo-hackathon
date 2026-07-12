import { TripWizard } from "@/components/forms/trip-wizard";
import { PageHeader } from "@/components/ui/page-header";
import { DriverStatus, VehicleStatus } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function NewTripPage() {
  await requirePermission("trips:manage");

  const [vehicles, drivers] = await Promise.all([
    prisma.vehicle.findMany({
      where: { status: VehicleStatus.AVAILABLE },
      select: { id: true, registrationNumber: true, vehicleName: true, vehicleType: true, maxLoadCapacity: true, region: true, currentOdometer: true },
      orderBy: { registrationNumber: "asc" }
    }),
    prisma.driver.findMany({
      where: { status: DriverStatus.AVAILABLE, licenseExpiryDate: { gt: new Date() } },
      select: { id: true, name: true, licenseCategory: true, licenseExpiryDate: true, safetyScore: true, region: true },
      orderBy: { name: "asc" }
    })
  ]);

  return (
    <>
      <PageHeader title="Create Trip" description="Build a trip draft using only currently eligible vehicles and compliant drivers." />
      <TripWizard vehicles={vehicles} drivers={drivers} />
    </>
  );
}
