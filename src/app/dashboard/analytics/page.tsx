"use client";

import { useTRPC } from "@/lib/trpc";
import { useQuery } from "@tanstack/react-query";
import { formatCents } from "@/lib/utils";

function BarChart({
  data,
}: {
  data: Array<{
    date: string;
    recovered: number;
    failed: number;
    amountCents: number;
  }>;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-400">
        No recovery data yet
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.recovered + d.failed), 1);

  return (
    <div className="flex h-48 items-end gap-1">
      {data.map((d) => {
        const total = d.recovered + d.failed;
        const height = (total / maxCount) * 100;
        const recoveredHeight =
          total > 0 ? (d.recovered / total) * height : 0;
        const failedHeight = height - recoveredHeight;
        const date = new Date(d.date);
        const label = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        return (
          <div
            key={d.date}
            className="group relative flex flex-1 flex-col items-center"
          >
            <div className="absolute -top-10 hidden rounded bg-gray-900 px-2 py-1 text-[10px] text-white group-hover:block">
              {d.recovered} recovered, {d.failed} failed
              <br />
              {formatCents(d.amountCents)}
            </div>
            <div
              className="w-full min-w-[4px] max-w-[24px]"
              style={{ height: `${height}%` }}
            >
              <div
                className="w-full rounded-t bg-emerald-500"
                style={{ height: `${recoveredHeight}%` }}
              />
              <div
                className="w-full bg-rose-300"
                style={{ height: `${failedHeight}%` }}
              />
            </div>
            <span className="mt-1 text-[9px] text-gray-400">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const trpc = useTRPC();
  const { data: timeline } = useQuery(
    trpc.recovery.getRecoveryTimeline.queryOptions({ days: 30 })
  );
  const { data: metrics } = useQuery(trpc.recovery.getMetrics.queryOptions());

  const totalRecoveredAmount = (timeline ?? []).reduce(
    (sum, d) => sum + d.amountCents,
    0
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Recovery performance over time
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-[13px] font-medium text-gray-500">
            30-day recovered
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {formatCents(totalRecoveredAmount)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-[13px] font-medium text-gray-500">
            Total recoveries
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {metrics?.totalRecovered ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-[13px] font-medium text-gray-500">
            Active retries
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {metrics?.activeRetries ?? 0}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">
          Daily recovery activity
        </h3>
        <BarChart data={timeline ?? []} />
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            Recovered
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-rose-300" />
            Failed
          </div>
        </div>
      </div>
    </div>
  );
}
