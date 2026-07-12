import { Prisma } from "@prisma/client";
import { addDays, isBefore } from "date-fns";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { driverStatuses, labelize } from "@/lib/domain";
import { formatDate } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DriversPage({ searchParams }: PageProps) {
  const user = await requirePermission("drivers:read");
  const params = await searchParams;
  const q = getParam(params, "q");
  const status = getParam(params, "status");
  const region = getParam(params, "region");
  const page = Math.max(1, Number(getParam(params, "page") || "1"));
  const take = 10;
  const skip = (page - 1) * take;

  const where: Prisma.DriverWhereInput = {
    AND: [
      q ? { OR: [{ name: { contains: q } }, { licenseNumber: { contains: q } }, { licenseCategory: { contains: q } }] } : {},
      status ? { status } : {},
      region ? { region } : {}
    ]
  };

  const [drivers, total, regions] = await Promise.all([
    prisma.driver.findMany({ where, orderBy: { updatedAt: "desc" }, skip, take }),
    prisma.driver.count({ where }),
    prisma.driver.findMany({ distinct: ["region"], select: { region: true }, orderBy: { region: "asc" } })
  ]);
  const pages = Math.max(1, Math.ceil(total / take));
  const soon = addDays(new Date(), 30);

  return (
    <>
      <PageHeader
        title="Drivers"
        description="Driver roster with compliance, availability, license validity, and safety scores."
        actions={
          hasPermission(user.role, "drivers:manage") ? (
            <LinkButton href="/drivers/new">
              <Plus className="h-4 w-4" />
              Add driver
            </LinkButton>
          ) : null
        }
      />

      <form className="mb-4 grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[1fr_180px_180px_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input name="q" defaultValue={q} placeholder="Search name, license, category" className="w-full pl-9" />
        </label>
        <select name="status" defaultValue={status}>
          <option value="">All statuses</option>
          {driverStatuses.map((item) => (
            <option key={item} value={item}>
              {labelize(item)}
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
          <Link href="/drivers" className="inline-flex items-center rounded-md border px-4 text-sm font-medium">Clear</Link>
        </div>
      </form>

      {drivers.length === 0 ? (
        <EmptyState title="No drivers found" description="Adjust filters or add a qualified driver to the roster." />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Driver</th>
                  <th className="px-4 py-3">License</th>
                  <th className="px-4 py-3">License Status</th>
                  <th className="px-4 py-3">Safety</th>
                  <th className="px-4 py-3">Region</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Contact</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver) => {
                  const expired = isBefore(driver.licenseExpiryDate, new Date());
                  const expiring = !expired && isBefore(driver.licenseExpiryDate, soon);
                  return (
                    <tr key={driver.id} className="border-t hover:bg-muted/35">
                      <td className="px-4 py-3">
                        <Link href={`/drivers/${driver.id}`} className="font-medium text-primary hover:underline">{driver.name}</Link>
                        <p className="text-xs text-muted-foreground">{driver.email ?? "No email"}</p>
                      </td>
                      <td className="px-4 py-3">{driver.licenseNumber}<p className="text-xs text-muted-foreground">{driver.licenseCategory}</p></td>
                      <td className="px-4 py-3">
                        <Badge tone={expired ? "critical" : expiring ? "warning" : "good"}>{expired ? "Expired" : expiring ? "Expiring soon" : "Valid"}</Badge>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(driver.licenseExpiryDate)}</p>
                      </td>
                      <td className="px-4 py-3"><SafetyScore score={driver.safetyScore} /></td>
                      <td className="px-4 py-3">{driver.region}</td>
                      <td className="px-4 py-3"><StatusBadge status={driver.status} /></td>
                      <td className="px-4 py-3">{driver.contactNumber}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
            <span>Page {page} of {pages} · {total} drivers</span>
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

function SafetyScore({ score }: { score: number }) {
  return <Badge tone={score >= 90 ? "good" : score >= 75 ? "warning" : "critical"}>{score}/100</Badge>;
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
  return <Link href={`/drivers?${search.toString()}`} className="rounded-md border px-3 py-1 hover:bg-muted">{label}</Link>;
}
