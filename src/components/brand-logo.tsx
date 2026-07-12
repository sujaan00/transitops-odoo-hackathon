import { cn } from "@/lib/utils";

export function TransitOpsMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm",
        className
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 44 44" className="h-8 w-8" role="img">
        <path
          d="M10 28c7.2 0 8.8-12 16-12h8"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="3.5"
        />
        <path
          d="M10 16h7.5c7.3 0 9 12 16.5 12"
          fill="none"
          opacity="0.58"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="3.5"
        />
        <circle cx="10" cy="28" r="3.2" fill="currentColor" />
        <circle cx="10" cy="16" r="3.2" fill="currentColor" />
        <circle cx="34" cy="16" r="3.2" fill="currentColor" />
        <circle cx="34" cy="28" r="3.2" fill="currentColor" />
      </svg>
    </span>
  );
}

export function TransitOpsLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <TransitOpsMark />
      {!compact ? (
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">TransitOps</span>
          <span className="block truncate text-xs text-muted-foreground">Operations command</span>
        </span>
      ) : null}
    </span>
  );
}
