import { Skeleton } from "@/components/ui";

/** Server fallback while the car loads. */
export function CarDetailSkeleton() {
  return (
    <div
      className="max-w-page mx-auto flex flex-col gap-8 px-4 py-8 md:px-6 xl:px-8"
      aria-busy="true"
    >
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-10 w-2/3" />
      <div className="grid gap-10 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-xl md:h-120 lg:col-span-2" />
        <Skeleton className="hidden h-96 rounded-lg lg:block" />
      </div>
    </div>
  );
}
