"use client";

import { useTRPC } from "@/lib/trpc";
import { useQuery } from "@tanstack/react-query";
import { formatCents, timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Search, Filter, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

type PaymentEvent = {
  id: string;
  stripeInvoiceId: string;
  eventType: string;
  declineCode: string | null;
  declineType: string | null;
  amountCents: number | null;
  currency: string | null;
  attemptCount: number | null;
  createdAt: Date | null;
  customerEmail: string | null;
  customerName: string | null;
  status: "recovered" | "failed" | "active";
  recoveredAt: Date | null;
  recoveryMethod: string | null;
};

function StatusBadge({ status }: { status: PaymentEvent["status"] }) {
  const config = {
    recovered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    active: "bg-amber-50 text-amber-700 border-amber-200",
    failed: "bg-rose-50 text-rose-700 border-rose-200",
  };

  const labels = {
    recovered: "Recovered",
    active: "In progress",
    failed: "Failed",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        config[status]
      )}
    >
      {labels[status]}
    </span>
  );
}

function DeclineTypeBadge({ type }: { type: string | null }) {
  if (!type) return null;
  const config: Record<string, string> = {
    hard: "bg-rose-50 text-rose-600",
    soft: "bg-gray-100 text-gray-600",
    auth_required: "bg-blue-50 text-blue-600",
  };

  const labels: Record<string, string> = {
    hard: "Hard",
    soft: "Soft",
    auth_required: "Auth",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium",
        config[type] ?? "bg-gray-100 text-gray-600"
      )}
    >
      {labels[type] ?? type}
    </span>
  );
}

function PaymentRow({
  event,
  expanded,
  onToggle,
}: {
  event: PaymentEvent;
  expanded: boolean;
  onToggle: () => void;
}) {
  const trpc = useTRPC();
  const { data: retries } = useQuery({
    ...trpc.recovery.getRetryAttempts.queryOptions({
      paymentEventId: event.id,
    }),
    enabled: expanded,
  });

  return (
    <>
      <tr
        className="cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50"
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">
                {event.customerName ?? event.customerEmail ?? "Unknown"}
              </p>
              <p className="text-xs text-gray-500">{event.customerEmail}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-sm font-medium text-gray-900">
          {event.amountCents ? formatCents(event.amountCents) : "-"}
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={event.status} />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <DeclineTypeBadge type={event.declineType} />
            {event.declineCode && (
              <span className="text-xs text-gray-500">
                {event.declineCode}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-xs text-gray-500">
          {event.attemptCount ?? 0}
        </td>
        <td className="px-4 py-3 text-xs text-gray-500">
          {event.createdAt ? timeAgo(event.createdAt) : "-"}
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-gray-100 bg-gray-50/50">
          <td colSpan={6} className="px-4 py-4">
            <div className="pl-6">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Retry timeline
              </h4>
              {!retries || retries.length === 0 ? (
                <p className="text-xs text-gray-400">
                  No retries scheduled yet
                </p>
              ) : (
                <div className="space-y-2">
                  {retries.map((retry) => (
                    <div
                      key={retry.id}
                      className="flex items-center gap-3 text-xs"
                    >
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          retry.result === "success"
                            ? "bg-emerald-500"
                            : retry.result === "failed"
                              ? "bg-rose-500"
                              : retry.result === "skipped"
                                ? "bg-gray-300"
                                : "bg-amber-500"
                        )}
                      />
                      <span className="w-16 font-medium text-gray-600">
                        {retry.result}
                      </span>
                      <span className="text-gray-500">
                        {retry.strategy} strategy
                      </span>
                      <span className="text-gray-400">
                        {retry.executedAt
                          ? `executed ${timeAgo(retry.executedAt)}`
                          : `scheduled ${retry.scheduledAt ? timeAgo(retry.scheduledAt) : ""}`}
                      </span>
                      {retry.declineCode && (
                        <span className="text-rose-500">
                          {retry.declineCode}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 flex gap-4 text-xs text-gray-500">
                <span>Invoice: {event.stripeInvoiceId}</span>
                {event.recoveryMethod && (
                  <span>Recovered via: {event.recoveryMethod}</span>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function PaymentsPage() {
  const trpc = useTRPC();
  const { data: events, isLoading } = useQuery(
    trpc.recovery.getRecentPaymentEvents.queryOptions({
      limit: 50,
      offset: 0,
    })
  );

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = (events ?? []).filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.customerName?.toLowerCase().includes(q) ||
      e.customerEmail?.toLowerCase().includes(q) ||
      e.stripeInvoiceId.toLowerCase().includes(q) ||
      e.declineCode?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Failed payments
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Track and manage payment recovery campaigns
        </p>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer, invoice, or decline code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
          <Filter className="h-3.5 w-3.5" />
          Filter
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-500">
              {events?.length === 0
                ? "No failed payments yet. Connect your Stripe account to get started."
                : "No results match your search."}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Customer
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Amount
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Decline
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Attempts
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  When
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((event) => (
                <PaymentRow
                  key={event.id}
                  event={event}
                  expanded={expandedId === event.id}
                  onToggle={() =>
                    setExpandedId(expandedId === event.id ? null : event.id)
                  }
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
