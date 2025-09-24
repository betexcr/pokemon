export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 animate-pulse">
      <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
      <div className="h-4 w-96 bg-gray-200 dark:bg-gray-800 rounded mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <div className="h-64 rounded border bg-gray-100 dark:bg-gray-900/40" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded border bg-gray-100 dark:bg-gray-900/40" />
          ))}
        </div>
      </div>
    </div>
  );
}

