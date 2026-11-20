import { AppLayout } from "@/components/layout/app-layout";

export default function Loading() {
  return (
    <AppLayout pageTitle="Memuat...">
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-7 w-48 rounded-xl bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 w-72 rounded-lg bg-gray-100 dark:bg-gray-850" />
          </div>
          <div className="h-9 w-32 rounded-xl bg-gray-200 dark:bg-gray-800" />
        </div>

        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-center justify-between">
                <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="size-8 rounded-xl bg-gray-100 dark:bg-gray-800" />
              </div>
              <div className="mt-3 h-6 w-12 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          ))}
        </div>

        {/* Content Area Skeleton */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs dark:border-gray-800 dark:bg-gray-900 space-y-4">
          <div className="h-5 w-48 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 rounded-xl bg-gray-50 dark:bg-gray-800/60" />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
