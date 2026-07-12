import { addDays, isBefore } from "date-fns";
import { notFound } from "next/navigation";
import { Route, ShieldCheck, ShieldX, Star, UserRound } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { TripStatus } from "@/lib/domain";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { asNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("drivers:read");
  const { id } = await params;
  const driver = await prisma.driver.findUnique({
    where: { id },
    include: {
      trips: { include: { vehicle: true }, orderBy: { plannedStartDate: "desc" } }
    }
  });

  if (!driver) notFound();

  const activities = await prisma.activityLog.findMany({ where: { entityId: driver.id }, orderBy: { timestamp: "desc" }, take: 6 });
  const currentTrip = driver.trips.find((trip) => trip.status === TripStatus.DISPATCHED);
  const completedTrips = driver.trips.filter((trip) => trip.status === TripStatus.COMPLETED);
  const revenue = completedTrips.reduce((sum, trip) => sum + asNumber(trip.revenue), 0);
  const expired = isBefore(driver.licenseExpiryDate, new Date());
  const expiring = !expired && isBefore(driver.licenseExpiryDate, addDays(new Date(), 30));

  return (
    <>
      <PageHeader title={driver.name} description={`${driver.licenseCategory} driver · ${driver.region} region · ${driver.contactNumber}`} />
      <div className="mb-6 flex flex-wrap gap-2">
        <StatusBadge status={driver.status} />
        <Badge tone={expired ? "critical" : expiring ? "warning" : "good"}>{expired ? "License expired" : expiring ? "License expiring soon" : "License valid"}</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Safety Score" value={`${driver.safetyScore}/100`} icon={Star} tone={driver.safetyScore >= 90 ? "emerald" : driver.safetyScore >= 75 ? "amber" : "red"} />
        <MetricCard title="Completed Trips" value={formatNumber(completedTrips.length)} icon={Route} tone="blue" />
        <MetricCard title="Revenue Handled" value={formatCurrency(revenue)} icon={ShieldCheck} />
        <MetricCard title="Compliance" value={expired ? "Blocked" : "Clear"} detail={formatDate(driver.licenseExpiryDate)} icon={expired ? ShieldX : ShieldCheck} tone={expired ? "red" : "emerald"} />
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Driver Profile</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm md:grid-cols-2">
              <Info label="Email" value={driver.email ?? "Not provided"} />
              <Info label="License Number" value={driver.licenseNumber} />
              <Info label="License Expiry" value={formatDate(driver.licenseExpiryDate)} />
              <Info label="Current Trip" value={currentTrip ? `${currentTrip.tripNumber} · ${currentTrip.vehicle.registrationNumber}` : "None"} />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {activities.length === 0 ? <p className="text-sm text-muted-foreground">No activity recorded yet.</p> : null}
            {activities.map((activity) => (
              <div key={activity.id} className="border-b pb-3 last:border-0 last:pb-0">
                <p className="text-sm font-medium">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(activity.timestamp)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle><span className="inline-flex items-center gap-2"><UserRound className="h-4 w-4" />Trip History</span></CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="py-2">Trip</th><th>Route</th><th>Vehicle</th><th>Status</th><th>Revenue</th></tr>
            </thead>
            <tbody>
              {driver.trips.map((trip) => (
                <tr key={trip.id} className="border-t">
                  <td className="py-3"><Link href={`/trips/${trip.id}`} className="font-medium text-primary hover:underline">{trip.tripNumber}</Link></td>
                  <td>{trip.source} to {trip.destination}</td>
                  <td>{trip.vehicle.registrationNumber}</td>
                  <td><StatusBadge status={trip.status} /></td>
                  <td>{formatCurrency(trip.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
