import { cn } from "@/lib/utils";

const toneStyles = {
  neutral: "bg-muted text-muted-foreground",
  good: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  info: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  critical: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  violet: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200"
};

export function Badge({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: keyof typeof toneStyles; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", toneStyles[tone], className)}>
      {children}
    </span>
  );
}
