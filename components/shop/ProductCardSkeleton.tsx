export default function ProductCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border p-3">
      <div className="aspect-square w-full rounded-lg bg-muted" />
      <div className="mt-3 h-4 w-3/4 rounded bg-muted" />
      <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
      <div className="mt-3 h-4 w-1/3 rounded bg-muted" />
    </div>
  );
}
