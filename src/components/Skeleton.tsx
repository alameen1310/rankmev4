import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-muted skeleton-shimmer",
        className
      )}
    />
  );
};

export const LeaderboardSkeleton = () => {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div 
          key={i} 
          className="flex items-center gap-3 p-4 glass rounded-xl min-h-[72px] animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="w-8 h-6 rounded bg-muted/60" />
          <div className="w-10 h-10 rounded-full bg-muted/60" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-28 rounded bg-muted/60" />
            <div className="h-3 w-16 rounded bg-muted/60" />
          </div>
          <div className="text-right space-y-2">
            <div className="h-4 w-16 ml-auto rounded bg-muted/60" />
            <div className="h-5 w-14 ml-auto rounded-full bg-muted/60" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 p-4 animate-pulse">
      {/* User header skeleton */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-muted/60" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-32 rounded bg-muted/60" />
            <div className="h-4 w-24 rounded bg-muted/60" />
          </div>
          <div className="text-center space-y-1">
            <div className="h-6 w-8 mx-auto rounded bg-muted/60" />
            <div className="h-3 w-12 rounded bg-muted/60" />
          </div>
        </div>
      </div>
      
      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div 
            key={i} 
            className="glass rounded-xl p-6 min-h-[140px] flex flex-col justify-between"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="w-6 h-6 rounded bg-muted/60" />
            <div className="space-y-2">
              <div className="h-7 w-16 rounded bg-muted/60" />
              <div className="h-3 w-20 rounded bg-muted/60" />
            </div>
          </div>
        ))}
      </div>

      {/* Weekly progress skeleton */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-2xl p-4 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-muted/60" />
          <div className="h-3 w-16 mt-2 rounded bg-muted/60" />
        </div>
        <div className="col-span-2 glass rounded-2xl p-4">
          <div className="h-4 w-24 mb-3 rounded bg-muted/60" />
          <div className="flex gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-muted/60" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const SubjectCardSkeleton = () => {
  return (
    <div className="glass rounded-xl p-4 min-h-[140px] animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-muted/60" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-20 rounded bg-muted/60" />
          <div className="h-3 w-16 rounded bg-muted/60" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-2 w-full rounded-full bg-muted/60" />
        <div className="flex justify-between">
          <div className="h-3 w-12 rounded bg-muted/60" />
          <div className="h-3 w-16 rounded bg-muted/60" />
        </div>
      </div>
    </div>
  );
};

export const ProfileSkeleton = () => {
  return (
    <div className="space-y-6 p-4 animate-pulse">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-muted/60 mx-auto mb-3" />
        <div className="h-5 w-32 rounded bg-muted/60 mx-auto mb-2" />
        <div className="h-4 w-40 rounded bg-muted/60 mx-auto" />
      </div>

      {/* Stats */}
      <div className="glass rounded-2xl p-4">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-muted/60" />
              <div className="h-3 w-10 mt-2 rounded bg-muted/60" />
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="glass rounded-2xl p-4">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-muted/60" />
              <div className="h-3 w-12 mt-2 rounded bg-muted/60" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
