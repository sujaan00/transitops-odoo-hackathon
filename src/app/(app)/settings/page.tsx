import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/rbac";

export default async function SettingsPage() {
  const user = await requirePermission("settings:read");

  return (
    <>
      <PageHeader title="Settings" description="Operational defaults for the local hackathon demo environment." />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Account</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><span className="font-medium">Name:</span> {user.name}</p>
            <p><span className="font-medium">Email:</span> {user.email}</p>
            <p><span className="font-medium">Role:</span> {user.role}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Calculation Formulas</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Fleet utilization = vehicles currently on trip / active non-retired vehicles x 100.</p>
            <p>Operational cost = fuel cost + maintenance cost.</p>
            <p>Vehicle ROI = (revenue - fuel cost - maintenance cost) / acquisition cost.</p>
            <p>Fuel efficiency = distance travelled / fuel consumed.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
