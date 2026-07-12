import { Prisma } from "@prisma/client";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { labelize, vehicleStatuses } from "@/lib/domain";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VehiclesPage({ searchParams }: PageProps) {
  const user = await requirePermission("vehicles:read");
  const params = await searchParams;
  const q = getParam(params, "q");
  const status = getParam(params, "status");
  const type = getParam(params, "type");
  const region = getParam(params, "region");
  const page = Math.max(1, Number(getParam(params, "page") || "1"));
  const take = 10;
  const skip = (page - 1) * take;

  const where: Prisma.VehicleWhereInput = {
    AND: [
      q
        ? {
            OR: [
              { registrationNumber: { contains: q } },
              { vehicleName: { contains: q } },
              { manufacturer: { contains: q } },
              { model: { contains: q } }
            ]
          }
        : {},
      status ? { status } : {},
      type ? { vehicleType: type } : {},
      region ? { region } : {}
    ]
  };

  const [vehicles, total, vehicleTypes, regions] = await Promise.all([
    prisma.vehicle.findMany({ where, orderBy: { updatedAt: "desc" }, skip, take }),
    prisma.vehicle.count({ where }),
    prisma.vehicle.findMany({ distinct: ["vehicleType"], select: { vehicleType: true }, orderBy: { vehicleType: "asc" } }),
    prisma.vehicle.findMany({ distinct: ["region"], select: { region: true }, orderBy: { region: "asc" } })
  ]);
  const pages = Math.max(1, Math.ceil(total / take));

  return (
    <>
      <PageHeader
        title="Vehicles"
        description="Fleet registry with dispatch availability, capacity, odometer, and lifecycle status."
        actions={
          hasPermission(user.role, "vehicles:manage") ? (
            <LinkButton href="/vehicles/new">
              <Plus className="h-4 w-4" />
              Add vehicle
            </LinkButton>
          ) : null
        }
      />

      <form className="mb-4 grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[1fr_180px_180px_180px_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input name="q" defaultValue={q} placeholder="Search registration, name, model" className="w-full pl-9" />
        </label>
        <select name="status" defaultValue={status}>
          <option value="">All statuses</option>
          {vehicleStatuses.map((item) => (
            <option key={item} value={item}>
              {labelize(item)}
            </option>
          ))}
        </select>
        <select name="type" defaultValue={type}>
          <option value="">All types</option>
          {vehicleTypes.map((item) => (
            <option key={item.vehicleType} value={item.vehicleType}>
              {item.vehicleType}
            </option>
          ))}
        </select>
        <select name="region" defaultValue={region}>
          <option value="">All regions</option>
          {regions.map((item) => (
            <option key={item.region} value={item.region}>
              {item.region}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button className="rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Filter</button>
          <Link href="/vehicles" className="inline-flex items-center rounded-md border px-4 text-sm font-medium">
            Clear
          </Link>
        </div>
      </form>

      {vehicles.length === 0 ? (
        <EmptyState title="No vehicles found" description="Adjust filters or add a new vehicle to the fleet registry." />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Capacity</th>
                  <th className="px-4 py-3">Odometer</th>
                  <th className="px-4 py-3">Region</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Acquired</th>
                  <th className="px-4 py-3 text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-t hover:bg-muted/35">
                    <td className="px-4 py-3">
                      <Link href={`/vehicles/${vehicle.id}`} className="font-medium text-primary hover:underline">
                        {vehicle.registrationNumber}
                      </Link>
                      <p className="text-xs text-muted-foreground">{vehicle.vehicleName} · {vehicle.manufacturer} {vehicle.model}</p>
                    </td>
                    <td className="px-4 py-3">{vehicle.vehicleType}</td>
                    <td className="px-4 py-3">{formatNumber(vehicle.maxLoadCapacity, " kg")}</td>
                    <td className="px-4 py-3">{formatNumber(vehicle.currentOdometer, " km")}</td>
                    <td className="px-4 py-3">{vehicle.region}</td>
                    <td className="px-4 py-3"><StatusBadge status={vehicle.status} /></td>
                    <td className="px-4 py-3">{formatDate(vehicle.acquisitionDate)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(vehicle.acquisitionCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
            <span>Page {page} of {pages} · {total} vehicles</span>
            <div className="flex gap-2">
              <PageLink disabled={page <= 1} page={page - 1} params={params} label="Previous" />
              <PageLink disabled={page >= pages} page={page + 1} params={params} label="Next" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function PageLink({ disabled, page, params, label }: { disabled: boolean; page: number; params: Record<string, string | string[] | undefined>; label: string }) {
  if (disabled) {
    return <span className="rounded-md border px-3 py-1 opacity-50">{label}</span>;
  }
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const stringValue = Array.isArray(value) ? value[0] : value;
    if (stringValue && key !== "page") search.set(key, stringValue);
  }
  search.set("page", String(page));
  return <Link href={`/vehicles?${search.toString()}`} className="rounded-md border px-3 py-1 hover:bg-muted">{label}</Link>;
}
