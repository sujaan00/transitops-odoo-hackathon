import { Prisma } from "@prisma/client";
import { Plus } from "lucide-react";
import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ExpenseCategory, expenseCategories, labelize } from "@/lib/domain";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { asNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FuelExpensesPage({ searchParams }: PageProps) {
  const user = await requirePermission("finance:read");
  const params = await searchParams;
  const category = getParam(params, "category");
  const vehicleId = getParam(params, "vehicleId");

  const expenseWhere: Prisma.ExpenseWhereInput = {
    AND: [category ? { category } : {}, vehicleId ? { vehicleId } : {}]
  };
  const fuelWhere: Prisma.FuelLogWhereInput = {
    AND: [vehicleId ? { vehicleId } : {}]
  };

  const [fuelLogs, expenses, vehicles] = await Promise.all([
    prisma.fuelLog.findMany({ where: fuelWhere, include: { vehicle: true, trip: true }, orderBy: { date: "desc" }, take: 30 }),
    prisma.expense.findMany({ where: expenseWhere, include: { vehicle: true, trip: true }, orderBy: { date: "desc" }, take: 30 }),
    prisma.vehicle.findMany({ select: { id: true, registrationNumber: true, vehicleName: true }, orderBy: { registrationNumber: "asc" } })
  ]);

  const fuelCost = fuelLogs.reduce((sum, log) => sum + asNumber(log.totalCost), 0);
  const liters = fuelLogs.reduce((sum, log) => sum + asNumber(log.liters), 0);
  const otherExpenses = expenses.filter((expense) => expense.category !== ExpenseCategory.FUEL).reduce((sum, expense) => sum + asNumber(expense.amount), 0);

  return (
    <>
      <PageHeader
        title="Fuel & Expenses"
        description="Track fuel cost, fuel efficiency inputs, and operational expenses."
        actions={
          hasPermission(user.role, "finance:manage") ? (
            <>
              <LinkButton href="/fuel-expenses/new-fuel"><Plus className="h-4 w-4" />Fuel log</LinkButton>
              <LinkButton href="/fuel-expenses/new-expense" variant="outline"><Plus className="h-4 w-4" />Expense</LinkButton>
            </>
          ) : null
        }
      />

      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <Summary title="Fuel Cost" value={formatCurrency(fuelCost)} />
        <Summary title="Fuel Logged" value={formatNumber(liters, " L")} />
        <Summary title="Other Expenses" value={formatCurrency(otherExpenses)} />
      </div>

      <form className="mb-4 grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[220px_260px_auto]">
        <select name="category" defaultValue={category}>
          <option value="">All expense categories</option>
          {expenseCategories.map((item) => (
            <option key={item} value={item}>{labelize(item)}</option>
          ))}
        </select>
        <select name="vehicleId" defaultValue={vehicleId}>
          <option value="">All vehicles</option>
          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>{vehicle.registrationNumber} · {vehicle.vehicleName}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button className="rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Filter</button>
          <Link href="/fuel-expenses" className="inline-flex items-center rounded-md border px-4 text-sm font-medium">Clear</Link>
        </div>
      </form>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Fuel Logs</CardTitle></CardHeader>
          <CardContent>
            {fuelLogs.length === 0 ? <EmptyState title="No fuel logs" description="Add a fuel log to track consumption and price per liter." /> : null}
            <div className="space-y-3">
              {fuelLogs.map((log) => (
                <div key={log.id} className="rounded-md border p-3 text-sm">
                  <p className="font-medium">{log.vehicle.registrationNumber} · {formatNumber(log.liters, " L")} · {formatCurrency(log.totalCost)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(log.date)} · {formatNumber(log.pricePerLiter, " INR/L")} · {log.trip?.tripNumber ?? "No trip"}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Expenses</CardTitle></CardHeader>
          <CardContent>
            {expenses.length === 0 ? <EmptyState title="No expenses" description="Record tolls, parking, insurance, repairs, and other costs." /> : null}
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div key={expense.id} className="rounded-md border p-3 text-sm">
                  <p className="font-medium">{expense.vehicle.registrationNumber} · {expense.description} · {formatCurrency(expense.amount)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{labelize(expense.category)} · {formatDate(expense.date)} · {expense.trip?.tripNumber ?? "No trip"}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Summary({ title, value }: { title: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent><p className="text-2xl font-semibold">{value}</p></CardContent>
    </Card>
  );
}

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}
