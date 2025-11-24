interface SkeletonGridProps {
  count?: number;
  className?: string;
}

export function SkeletonGrid({ count = 10, className = '' }: SkeletonGridProps) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rl-skeleton"
        />
      ))}
    </div>
  );
}
