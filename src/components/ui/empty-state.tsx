import { SearchX } from "lucide-react";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center">
      <SearchX className="mb-3 h-8 w-8 text-muted-foreground" aria-hidden="true" />
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
