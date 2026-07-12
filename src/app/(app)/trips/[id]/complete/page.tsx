import { notFound } from "next/navigation";
import { CompleteTripForm } from "@/components/forms/complete-trip-form";
import { PageHeader } from "@/components/ui/page-header";
import { TripStatus } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export default async function CompleteTripPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("trips:manage");
  const { id } = await params;
  const trip = await prisma.trip.findUnique({ where: { id }, include: { vehicle: true } });
  if (!trip) notFound();
  if (trip.status !== TripStatus.DISPATCHED) notFound();

  return (
    <>
      <PageHeader title={`Complete ${trip.tripNumber}`} description="Enter final odometer and optional fuel data. Status changes will be applied transactionally." />
      <CompleteTripForm tripId={trip.id} startOdometer={trip.startOdometer ?? trip.vehicle.currentOdometer} />
    </>
  );
}
