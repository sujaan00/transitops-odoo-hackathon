export type ReportDefinition = {
  slug: string;
  title: string;
  description: string;
};

export const reportDefinitions: ReportDefinition[] = [
  { slug: "fleet-summary", title: "Fleet Summary", description: "Vehicle lifecycle, capacity, region, and current status." },
  { slug: "vehicle-performance", title: "Vehicle Performance", description: "Revenue, fuel, maintenance, cost, and ROI by vehicle." },
  { slug: "driver-performance", title: "Driver Performance", description: "Trips, compliance, safety scores, and revenue handled." },
  { slug: "trip-summary", title: "Trip Summary", description: "Routes, assignments, cargo, revenue, and status." },
  { slug: "maintenance-costs", title: "Maintenance Costs", description: "Service history and maintenance spend." },
  { slug: "fuel-consumption", title: "Fuel Consumption", description: "Fuel liters, cost, price per liter, and vehicle linkage." },
  { slug: "operational-expenses", title: "Operational Expenses", description: "Expense categories, receipts, amounts, and trip links." },
  { slug: "vehicle-roi", title: "Vehicle ROI", description: "ROI formula output by vehicle." }
];

export function getReportDefinition(slug: string) {
  return reportDefinitions.find((report) => report.slug === slug);
}
