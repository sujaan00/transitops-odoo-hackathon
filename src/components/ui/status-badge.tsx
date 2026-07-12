import { Badge } from "@/components/ui/badge";
import { DriverStatus, MaintenanceStatus, TripStatus, VehicleStatus, labelize } from "@/lib/domain";

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === VehicleStatus.AVAILABLE || status === DriverStatus.AVAILABLE || status === TripStatus.COMPLETED || status === MaintenanceStatus.COMPLETED
      ? "good"
      : status === VehicleStatus.ON_TRIP || status === DriverStatus.ON_TRIP || status === TripStatus.DISPATCHED
        ? "info"
        : status === TripStatus.DRAFT || status === MaintenanceStatus.SCHEDULED || status === DriverStatus.OFF_DUTY
          ? "warning"
          : "critical";

  return <Badge tone={tone}>{labelize(status)}</Badge>;
}
