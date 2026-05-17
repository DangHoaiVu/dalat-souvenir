import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("skeleton", className)} {...props} />;
}

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-[--color-border] bg-surface shadow-card">
      <Skeleton className="aspect-[4/5] rounded-b-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <div className="flex items-center justify-between pt-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function OrderRowSkeleton() {
  return (
    <div className="rounded-lg border border-[--color-border] bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-20 w-full" />
    </div>
  );
}

function AdminTableRowSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-4 border-b border-[--color-border] p-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-20 justify-self-end rounded-md" />
    </div>
  );
}

export { Skeleton, ProductCardSkeleton, OrderRowSkeleton, AdminTableRowSkeleton };
