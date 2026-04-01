export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 animate-pulse space-y-4">
      <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
      <div className="h-4 w-72 bg-gray-200 dark:bg-gray-800 rounded" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl border bg-gray-100 dark:bg-gray-900/40" />
        ))}
      </div>
    </div>
  );
}
