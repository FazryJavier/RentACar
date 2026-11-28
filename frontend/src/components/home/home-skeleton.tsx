import { Skeleton } from "@/components/ui";

export function HeroSkeleton() {
  return (
    <div aria-hidden="true" className="max-w-page mx-auto px-4 pt-8 pb-16 md:px-6 lg:pt-12 xl:px-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-7 w-48 rounded-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-14 w-72 rounded-full" />
        </div>
        <Skeleton className="h-72 rounded-xl sm:h-96 lg:h-120" />
      </div>
      <Skeleton className="mt-10 h-20 rounded-xl" />
    </div>
  );
}

export function SectionsSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="max-w-page mx-auto flex flex-col gap-16 px-4 py-16 md:px-6 xl:px-8"
    >
      <Skeleton className="h-96 rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
