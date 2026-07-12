export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-56 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-lg border bg-muted/40" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-lg border bg-muted/40" />
    </div>
  );
}
