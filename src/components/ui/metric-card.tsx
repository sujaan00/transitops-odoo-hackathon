import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = "teal"
}: {
  title: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
  tone?: "teal" | "blue" | "amber" | "red" | "violet" | "emerald";
}) {
  const colors = {
    teal: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-200",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200",
    red: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200",
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200",
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"
  };

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <span className={cn("inline-flex h-10 w-10 items-center justify-center rounded-md", colors[tone])}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-2xl font-semibold">{value}</p>
      {detail ? <p className="mt-1 text-sm text-muted-foreground">{detail}</p> : null}
    </div>
  );
}
