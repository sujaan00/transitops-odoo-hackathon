import { MaintenanceForm } from "@/components/forms/maintenance-form";
import { PageHeader } from "@/components/ui/page-header";
import { VehicleStatus } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function NewMaintenancePage() {
  await requirePermission("maintenance:manage");
  const vehicles = await prisma.vehicle.findMany({
    where: { status: { in: [VehicleStatus.AVAILABLE, VehicleStatus.IN_SHOP] } },
    select: { id: true, registrationNumber: true, vehicleName: true, currentOdometer: true },
    orderBy: { registrationNumber: "asc" }
  });

  return (
    <>
      <PageHeader title="New Maintenance" description="Creating active maintenance moves the vehicle to IN_SHOP inside a transaction." />
      <MaintenanceForm vehicles={vehicles} />
    </>
  );
}
