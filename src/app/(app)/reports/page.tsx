import { FileDown } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { requirePermission } from "@/lib/rbac";

const reports = [
  ["fleet-summary", "Fleet Summary", "Vehicle lifecycle, capacity, region, and current status."],
  ["vehicle-performance", "Vehicle Performance", "Revenue, fuel, maintenance, cost, and ROI by vehicle."],
  ["driver-performance", "Driver Performance", "Trips, compliance, safety scores, and revenue handled."],
  ["trip-summary", "Trip Summary", "Routes, assignments, cargo, revenue, and status."],
  ["maintenance-costs", "Maintenance Costs", "Service history and maintenance spend."],
  ["fuel-consumption", "Fuel Consumption", "Fuel liters, cost, price per liter, and vehicle linkage."],
  ["operational-expenses", "Operational Expenses", "Expense categories, receipts, amounts, and trip links."],
  ["vehicle-roi", "Vehicle ROI", "ROI formula output by vehicle."],
];

export default async function ReportsPage() {
  await requirePermission("reports:read");

  return (
    <>
      <PageHeader title="Reports" description="Export operational datasets as CSV. Exports are generated from current database records." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {reports.map(([slug, title, description]) => (
          <Card key={slug}>
            <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
            <CardContent>
              <p className="min-h-12 text-sm text-muted-foreground">{description}</p>
              <LinkButton href={`/api/reports/${slug}`} className="mt-4 w-full" variant="outline">
                <FileDown className="h-4 w-4" />
                Export CSV
              </LinkButton>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
