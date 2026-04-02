export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[2/3] bg-surface-2 rounded-lg mb-2" />
            <div className="h-3 bg-surface-2 rounded mb-1" />
            <div className="h-3 bg-surface-2 rounded w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
