import { Skeleton } from "@/components/ui";

export function InfoSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="max-w-page mx-auto flex flex-col gap-6 px-4 py-12 md:px-6 lg:py-16 xl:px-8"
    >
      <Skeleton className="h-12 w-2/3" />
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
