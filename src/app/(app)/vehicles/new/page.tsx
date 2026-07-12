import { VehicleForm } from "@/components/forms/vehicle-form";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/rbac";

export default async function NewVehiclePage() {
  await requirePermission("vehicles:manage");

  return (
    <>
      <PageHeader title="Add Vehicle" description="Register a fleet asset with capacity, odometer, acquisition, and dispatch status data." />
      <VehicleForm />
    </>
  );
}
