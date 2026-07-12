import { notFound } from "next/navigation";
import { CompleteMaintenanceForm } from "@/components/forms/maintenance-form";
import { PageHeader } from "@/components/ui/page-header";
import { MaintenanceStatus } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export default async function CompleteMaintenancePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("maintenance:manage");
  const { id } = await params;
  const maintenance = await prisma.maintenanceLog.findUnique({ where: { id }, include: { vehicle: true } });
  if (!maintenance) notFound();
  if (maintenance.status === MaintenanceStatus.COMPLETED || maintenance.status === MaintenanceStatus.CANCELLED) notFound();

  return (
    <>
      <PageHeader title={`Close ${maintenance.maintenanceType}`} description={`${maintenance.vehicle.registrationNumber} will return to AVAILABLE unless it has been retired.`} />
      <CompleteMaintenanceForm maintenanceId={maintenance.id} />
    </>
  );
}
