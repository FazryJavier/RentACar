import { Skeleton } from "@/components/ui";
import { CarCardSkeleton } from "./car-card";

/** Server fallback while the first results load. */
export function FleetSkeleton() {
  return (
    <div
      className="max-w-page mx-auto flex flex-col gap-8 px-4 py-10 md:px-6 xl:px-8"
      aria-busy="true"
    >
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <h1 className="text-h1 text-text">Armada Kami</h1>
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <CarCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
