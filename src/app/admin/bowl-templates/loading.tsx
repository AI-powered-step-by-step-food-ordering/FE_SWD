export default function Loading() {
  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-40 bg-gray-200 animate-pulse rounded" />
          <div className="h-4 w-64 bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-10 w-64 bg-gray-200 animate-pulse rounded" />
          <div className="h-6 w-24 bg-gray-200 animate-pulse rounded" />
          <div className="h-10 w-36 bg-gray-200 animate-pulse rounded" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="p-4 border rounded-lg">
            <div className="h-5 w-32 bg-gray-200 animate-pulse rounded" />
            <div className="mt-2 h-4 w-full bg-gray-200 animate-pulse rounded" />
            <div className="mt-2 h-4 w-2/3 bg-gray-200 animate-pulse rounded" />
            <div className="mt-4 flex gap-2">
              <div className="h-9 w-20 bg-gray-200 animate-pulse rounded" />
              <div className="h-9 w-20 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}