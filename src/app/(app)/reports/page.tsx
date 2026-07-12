import { FileDown, FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { requirePermission } from "@/lib/rbac";
import { reportDefinitions } from "@/lib/report-definitions";

export default async function ReportsPage() {
  await requirePermission("reports:read");

  return (
    <>
      <PageHeader title="Reports" description="Export operational datasets as CSV or polished PDF files generated from current database records." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {reportDefinitions.map((report) => (
          <Card key={report.slug}>
            <CardHeader><CardTitle>{report.title}</CardTitle></CardHeader>
            <CardContent>
              <p className="min-h-12 text-sm text-muted-foreground">{report.description}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <LinkButton href={`/api/reports/${report.slug}`} className="w-full" variant="outline">
                  <FileDown className="h-4 w-4" />
                  CSV
                </LinkButton>
                <LinkButton href={`/api/reports/${report.slug}?format=pdf`} className="w-full" variant="outline">
                  <FileText className="h-4 w-4" />
                  PDF
                </LinkButton>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
