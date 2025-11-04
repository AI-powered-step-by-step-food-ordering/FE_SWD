export default function Loading() {
  // Route-level skeleton for categories page
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

      <div className="mt-6 overflow-hidden rounded-lg bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-6 gap-4">
                <div className="h-10 w-10 bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-40 bg-gray-200 animate-pulse rounded col-span-2" />
                <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
                <div className="h-5 w-20 bg-gray-200 animate-pulse rounded" />
                <div className="h-8 w-48 bg-gray-200 animate-pulse rounded justify-self-end" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}