import { FuelLogForm } from "@/components/forms/fuel-expense-forms";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function NewFuelLogPage() {
  await requirePermission("finance:manage");
  const [vehicles, trips] = await Promise.all([
    prisma.vehicle.findMany({ select: { id: true, registrationNumber: true, vehicleName: true }, orderBy: { registrationNumber: "asc" } }),
    prisma.trip.findMany({ select: { id: true, tripNumber: true }, orderBy: { plannedStartDate: "desc" }, take: 50 })
  ]);

  return (
    <>
      <PageHeader title="Add Fuel Log" description="Record liters, total cost, price per liter, odometer, and optional trip link." />
      <FuelLogForm vehicles={vehicles} trips={trips} />
    </>
  );
}
