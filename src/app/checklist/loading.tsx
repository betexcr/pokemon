export default function LoadingChecklist() {
  return (
    <div className="container mx-auto px-4 py-6 animate-pulse">
      <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
      <div className="h-20 w-full bg-gray-200 dark:bg-gray-700 rounded mb-4" />
      <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded" />)
        )}
      </div>
    </div>
  );
}

