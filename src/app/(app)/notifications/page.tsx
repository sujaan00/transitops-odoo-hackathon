import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { MarkNotificationRead } from "@/components/actions/notification-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { labelize } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requirePermission("notifications:read");
  const notifications = await prisma.notification.findMany({
    where: { OR: [{ userId: user.id }, { userId: null }] },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return (
    <>
      <PageHeader title="Notifications" description="Operational alerts for compliance, maintenance, and dispatch events." />
      {notifications.length === 0 ? (
        <EmptyState title="No notifications" description="New alerts will appear here as operations change." />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card key={notification.id} className={notification.readAt ? "opacity-75" : ""}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold">{notification.title}</h2>
                    <Badge tone={notification.readAt ? "neutral" : "info"}>{notification.readAt ? "Read" : "Unread"}</Badge>
                    <Badge tone="warning">{labelize(notification.type)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDistanceToNow(notification.createdAt, { addSuffix: true })}</p>
                </div>
                <div className="flex gap-2">
                  {notification.entityType && notification.entityId ? <EntityLink type={notification.entityType} id={notification.entityId} /> : null}
                  <MarkNotificationRead id={notification.id} read={Boolean(notification.readAt)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function EntityLink({ type, id }: { type: string; id: string }) {
  const href = type === "Trip" ? `/trips/${id}` : type === "Driver" ? `/drivers/${id}` : type === "Vehicle" ? `/vehicles/${id}` : type === "MaintenanceLog" ? "/maintenance" : null;
  if (!href) return null;
  return <Link href={href} className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium hover:bg-muted">Open</Link>;
}
