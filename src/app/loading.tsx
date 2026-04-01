export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse space-y-4 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-800" />
        <div className="mx-auto h-4 w-32 rounded bg-gray-200 dark:bg-gray-800" />
      </div>
    </div>
  );
}
