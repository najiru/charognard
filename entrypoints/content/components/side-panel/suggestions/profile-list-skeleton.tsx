import { Skeleton } from '@/components/ui/skeleton';

interface ProfileListSkeletonProps {
  count?: number;
}

export function ProfileListSkeleton({ count = 8 }: ProfileListSkeletonProps) {
  return (
    <div className="p-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="size-5 rounded" />
          <Skeleton className="size-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
