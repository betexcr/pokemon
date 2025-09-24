export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 animate-pulse space-y-4">
      <div className="h-6 w-80 bg-gray-200 dark:bg-gray-800 rounded" />
      <div className="h-4 w-[32rem] bg-gray-200 dark:bg-gray-800 rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="h-64 rounded border bg-gray-100 dark:bg-gray-900/40" />
        <div className="space-y-4">
          <div className="h-80 rounded border bg-gray-100 dark:bg-gray-900/40" />
          <div className="h-80 rounded border bg-gray-100 dark:bg-gray-900/40" />
        </div>
      </div>
    </div>
  );
}

