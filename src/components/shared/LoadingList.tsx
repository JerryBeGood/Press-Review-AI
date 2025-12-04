import { Skeleton } from "@/components/ui/skeleton";

interface LoadingListProps {
  count?: number;
}

export function LoadingList({ count = 5 }: LoadingListProps) {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="brutalist-box bg-white p-6 space-y-3">
          <Skeleton className="h-6 w-3/4 rounded-none bg-gray-200" />
          <Skeleton className="h-4 w-1/2 rounded-none bg-gray-200" />
          <Skeleton className="h-4 w-1/4 rounded-none bg-gray-200" />
        </div>
      ))}
    </div>
  );
}
