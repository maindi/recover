"use client";

import { useTRPC } from "@/lib/trpc";
import { useQuery } from "@tanstack/react-query";
import { formatCents, formatPercent } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

function MetricCard({
  label,
  value,
  subtext,
  icon: Icon,
  color = "indigo",
}: {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ElementType;
  color?: "indigo" | "emerald" | "amber" | "rose";
}) {
  const colorMap = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-gray-500">{label}</p>
        <div className={`rounded-lg p-2 ${colorMap[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
      {subtext && (
        <p className="mt-1 text-xs text-gray-500">{subtext}</p>
      )}
    </div>
  );
}

function RecentActivity({
  events,
}: {
  events: Array<{
    id: string;
    customerName: string | null;
    customerEmail: string | null;
    amountCents: number | null;
    status: "recovered" | "failed" | "active";
    declineType: string | null;
    createdAt: Date | null;
  }>;
}) {
  const statusConfig = {
    recovered: {
      label: "Recovered",
      className: "bg-emerald-50 text-emerald-700",
      icon: CheckCircle2,
    },
    active: {
      label: "In progress",
      className: "bg-amber-50 text-amber-700",
      icon: RefreshCw,
    },
    failed: {
      label: "Failed",
      className: "bg-rose-50 text-rose-700",
      icon: AlertTriangle,
    },
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Recent activity
        </h3>
      </div>
      <div className="divide-y divide-gray-100">
        {events.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            No payment events yet
          </div>
        )}
        {events.map((event) => {
          const config = statusConfig[event.status];
          const StatusIcon = config.icon;
          return (
            <div
              key={event.id}
              className="flex items-center justify-between px-5 py-3"
            >
              <div className="flex items-center gap-3">
                <StatusIcon
                  className={`h-4 w-4 ${
                    event.status === "recovered"
                      ? "text-emerald-500"
                      : event.status === "active"
                        ? "text-amber-500"
                        : "text-rose-500"
                  }`}
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {event.customerName ?? event.customerEmail ?? "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {event.declineType === "hard"
                      ? "Hard decline"
                      : event.declineType === "auth_required"
                        ? "Auth required"
                        : "Soft decline"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900">
                  {event.amountCents ? formatCents(event.amountCents) : "-"}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${config.className}`}
                >
                  {config.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const trpc = useTRPC();
  const { data: metrics } = useQuery(trpc.recovery.getMetrics.queryOptions());
  const { data: events } = useQuery(
    trpc.recovery.getRecentPaymentEvents.queryOptions({
      limit: 8,
      offset: 0,
    })
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">
          Recovery overview
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor your payment recovery performance
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="MRR saved"
          value={formatCents(metrics?.mrrSavedCents ?? 0)}
          subtext="Last 30 days"
          icon={DollarSign}
          color="emerald"
        />
        <MetricCard
          label="Recovery rate"
          value={formatPercent(metrics?.recoveryRate ?? 0)}
          subtext={`${metrics?.totalRecovered ?? 0} of ${metrics?.totalEvents ?? 0} recovered`}
          icon={TrendingUp}
          color="indigo"
        />
        <MetricCard
          label="Avg. recovery time"
          value={`${metrics?.avgRecoveryHours ?? 0}h`}
          subtext="Time to successful charge"
          icon={Clock}
          color="amber"
        />
        <MetricCard
          label="At risk"
          value={formatCents(metrics?.atRiskCents ?? 0)}
          subtext={`${metrics?.pendingEvents ?? 0} active campaigns`}
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      <RecentActivity events={events ?? []} />
    </div>
  );
}
