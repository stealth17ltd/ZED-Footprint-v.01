import { Skeleton } from '@/components/ui/skeleton';

interface PageSkeletonProps {
  statCards?: number;
  table?: boolean;
}

/** Layout skeleton shown while client pages fetch data — avoids blank spinner screens. */
export function PageSkeleton({ statCards = 3, table = true }: PageSkeletonProps) {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
          <Skeleton className="h-10 w-36 rounded-md" />
        </div>

        {statCards > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: statCards }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        )}

        {table && <Skeleton className="h-[420px] rounded-xl" />}
      </div>
    </div>
  );
}
