import { Prisma } from "@prisma/client";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { TripActions } from "@/components/actions/trip-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { labelize, tripStatuses } from "@/lib/domain";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TripsPage({ searchParams }: PageProps) {
  const user = await requirePermission("trips:read");
  const params = await searchParams;
  const q = getParam(params, "q");
  const status = getParam(params, "status");
  const region = getParam(params, "region");
  const page = Math.max(1, Number(getParam(params, "page") || "1"));
  const take = 10;
  const skip = (page - 1) * take;

  const where: Prisma.TripWhereInput = {
    AND: [
      q ? { OR: [{ tripNumber: { contains: q } }, { source: { contains: q } }, { destination: { contains: q } }] } : {},
      status ? { status } : {},
      region ? { region } : {}
    ]
  };

  const [trips, total, regions] = await Promise.all([
    prisma.trip.findMany({ where, include: { vehicle: true, driver: true }, orderBy: { plannedStartDate: "desc" }, skip, take }),
    prisma.trip.count({ where }),
    prisma.trip.findMany({ distinct: ["region"], select: { region: true }, orderBy: { region: "asc" } })
  ]);
  const pages = Math.max(1, Math.ceil(total / take));

  return (
    <>
      <PageHeader
        title="Trips"
        description="Dispatch workflow with server-enforced vehicle, driver, capacity, and compliance rules."
        actions={
          hasPermission(user.role, "trips:manage") ? (
            <LinkButton href="/trips/new">
              <Plus className="h-4 w-4" />
              New trip
            </LinkButton>
          ) : null
        }
      />

      <form className="mb-4 grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[1fr_180px_180px_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input name="q" defaultValue={q} placeholder="Search trip or route" className="w-full pl-9" />
        </label>
        <select name="status" defaultValue={status}>
          <option value="">All statuses</option>
          {tripStatuses.map((item) => (
            <option key={item} value={item}>
              {labelize(item)}
            </option>
          ))}
        </select>
        <select name="region" defaultValue={region}>
          <option value="">All regions</option>
          {regions.map((item) => (
            <option key={item.region} value={item.region}>{item.region}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button className="rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Filter</button>
          <Link href="/trips" className="inline-flex items-center rounded-md border px-4 text-sm font-medium">Clear</Link>
        </div>
      </form>

      {trips.length === 0 ? (
        <EmptyState title="No trips found" description="Create a trip draft to begin dispatch planning." />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Trip</th>
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Driver</th>
                  <th className="px-4 py-3">Cargo</th>
                  <th className="px-4 py-3">Revenue</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip) => (
                  <tr key={trip.id} className="border-t hover:bg-muted/35">
                    <td className="px-4 py-3">
                      <Link href={`/trips/${trip.id}`} className="font-medium text-primary hover:underline">{trip.tripNumber}</Link>
                      <p className="text-xs text-muted-foreground">{formatDate(trip.plannedStartDate)} · {trip.region}</p>
                    </td>
                    <td className="px-4 py-3">{trip.source} to {trip.destination}<p className="text-xs text-muted-foreground">{formatNumber(trip.plannedDistance, " km")} planned</p></td>
                    <td className="px-4 py-3">{trip.vehicle.registrationNumber}</td>
                    <td className="px-4 py-3">{trip.driver.name}</td>
                    <td className="px-4 py-3">{formatNumber(trip.cargoWeight, " kg")}</td>
                    <td className="px-4 py-3">{formatCurrency(trip.revenue)}</td>
                    <td className="px-4 py-3"><StatusBadge status={trip.status} /></td>
                    <td className="px-4 py-3">{hasPermission(user.role, "trips:manage") ? <TripActions tripId={trip.id} status={trip.status} /> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
            <span>Page {page} of {pages} · {total} trips</span>
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
  if (disabled) return <span className="rounded-md border px-3 py-1 opacity-50">{label}</span>;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const stringValue = Array.isArray(value) ? value[0] : value;
    if (stringValue && key !== "page") search.set(key, stringValue);
  }
  search.set("page", String(page));
  return <Link href={`/trips?${search.toString()}`} className="rounded-md border px-3 py-1 hover:bg-muted">{label}</Link>;
}
