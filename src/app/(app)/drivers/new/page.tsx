import { DriverForm } from "@/components/forms/driver-form";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/rbac";

export default async function NewDriverPage() {
  await requirePermission("drivers:manage");

  return (
    <>
      <PageHeader title="Add Driver" description="Register driver compliance, contact, availability, and safety score data." />
      <DriverForm />
    </>
  );
}
