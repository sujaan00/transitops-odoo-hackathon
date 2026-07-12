import { Prisma } from "@prisma/client";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { MaintenanceStatus, labelize, maintenanceStatuses } from "@/lib/domain";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { asNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MaintenancePage({ searchParams }: PageProps) {
  const user = await requirePermission("maintenance:read");
  const params = await searchParams;
  const q = getParam(params, "q");
  const status = getParam(params, "status");

  const where: Prisma.MaintenanceLogWhereInput = {
    AND: [
      q ? { OR: [{ maintenanceType: { contains: q } }, { description: { contains: q } }, { vehicle: { registrationNumber: { contains: q } } }] } : {},
      status ? { status } : {}
    ]
  };

  const records = await prisma.maintenanceLog.findMany({ where, include: { vehicle: true }, orderBy: { startDate: "desc" } });
  const active = records.filter((item) => item.status === MaintenanceStatus.ACTIVE);
  const scheduled = records.filter((item) => item.status === MaintenanceStatus.SCHEDULED);
  const completed = records.filter((item) => item.status === MaintenanceStatus.COMPLETED);
  const totalCost = records.reduce((sum, item) => sum + asNumber(item.cost), 0);

  return (
    <>
      <PageHeader
        title="Maintenance"
        description="Schedule, start, and close maintenance while automatically controlling dispatch availability."
        actions={
          hasPermission(user.role, "maintenance:manage") ? (
            <LinkButton href="/maintenance/new">
              <Plus className="h-4 w-4" />
              New maintenance
            </LinkButton>
          ) : null
        }
      />

      <div className="mb-4 grid gap-4 md:grid-cols-4">
        <Summary title="Active" value={active.length} />
        <Summary title="Scheduled" value={scheduled.length} />
        <Summary title="Completed" value={completed.length} />
        <Summary title="Total Cost" value={formatCurrency(totalCost)} />
      </div>

      <form className="mb-4 grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[1fr_200px_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input name="q" defaultValue={q} placeholder="Search type, vehicle, description" className="w-full pl-9" />
        </label>
        <select name="status" defaultValue={status}>
          <option value="">All statuses</option>
          {maintenanceStatuses.map((item) => (
            <option key={item} value={item}>{labelize(item)}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button className="rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Filter</button>
          <Link href="/maintenance" className="inline-flex items-center rounded-md border px-4 text-sm font-medium">Clear</Link>
        </div>
      </form>

      {records.length === 0 ? (
        <EmptyState title="No maintenance records" description="Create maintenance to control vehicle shop status and cost tracking." />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Maintenance</th>
                  <th className="px-4 py-3">Start</th>
                  <th className="px-4 py-3">Completion</th>
                  <th className="px-4 py-3">Odometer</th>
                  <th className="px-4 py-3">Cost</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-t hover:bg-muted/35">
                    <td className="px-4 py-3">
                      <Link href={`/vehicles/${record.vehicle.id}`} className="font-medium text-primary hover:underline">{record.vehicle.registrationNumber}</Link>
                      <p className="text-xs text-muted-foreground">{record.vehicle.vehicleName}</p>
                    </td>
                    <td className="px-4 py-3">{record.maintenanceType}<p className="text-xs text-muted-foreground">{record.description}</p></td>
                    <td className="px-4 py-3">{formatDate(record.startDate)}</td>
                    <td className="px-4 py-3">{formatDate(record.completionDate)}</td>
                    <td className="px-4 py-3">{formatNumber(record.odometerAtService, " km")}</td>
                    <td className="px-4 py-3">{formatCurrency(record.cost)}</td>
                    <td className="px-4 py-3"><StatusBadge status={record.status} /></td>
                    <td className="px-4 py-3">
                      {hasPermission(user.role, "maintenance:manage") && record.status !== MaintenanceStatus.COMPLETED && record.status !== MaintenanceStatus.CANCELLED ? (
                        <Link href={`/maintenance/${record.id}/complete`} className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted">Close</Link>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function Summary({ title, value }: { title: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent><p className="text-2xl font-semibold">{value}</p></CardContent>
    </Card>
  );
}

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}
