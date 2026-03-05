"use client";

import { useTRPC } from "@/lib/trpc";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Plug,
  CheckCircle2,
  Clock,
  Mail,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

const RETRY_PRESETS = [
  {
    name: "Aggressive",
    description: "Fast recovery for soft declines",
    hours: [4, 24, 48, 96, 168],
  },
  {
    name: "Standard",
    description: "Balanced retry schedule",
    hours: [4, 24, 72, 120, 168],
  },
  {
    name: "Conservative",
    description: "Gentle, less frequent retries",
    hours: [24, 72, 168, 336, 504],
  },
];

function StripeConnectionCard() {
  const trpc = useTRPC();
  const { data: account, isLoading } = useQuery(
    trpc.accounts.getCurrent.queryOptions()
  );

  const connected = !!account?.stripeAccountId;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              connected ? "bg-emerald-50" : "bg-gray-100"
            )}
          >
            {connected ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <Plug className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Stripe connection
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              {connected
                ? `Connected as ${account.companyName ?? account.stripeAccountId}`
                : "Connect your Stripe account to start recovering payments"}
            </p>
          </div>
        </div>
        {!isLoading && (
          <a
            href="/api/stripe/connect"
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              connected
                ? "border border-gray-200 text-gray-600 hover:bg-gray-50"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            )}
          >
            {connected ? "Reconnect" : "Connect Stripe"}
          </a>
        )}
      </div>
    </div>
  );
}

function RetryScheduleCard() {
  const [selected, setSelected] = useState(1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
          <Clock className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Retry schedule
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Configure when to retry failed payments
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {RETRY_PRESETS.map((preset, i) => (
          <button
            key={preset.name}
            onClick={() => setSelected(i)}
            className={cn(
              "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
              selected === i
                ? "border-indigo-200 bg-indigo-50/50"
                : "border-gray-200 hover:bg-gray-50"
            )}
          >
            <div
              className={cn(
                "mt-0.5 h-4 w-4 rounded-full border-2",
                selected === i
                  ? "border-indigo-600 bg-indigo-600"
                  : "border-gray-300"
              )}
            >
              {selected === i && (
                <div className="flex h-full items-center justify-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {preset.name}
              </p>
              <p className="text-xs text-gray-500">{preset.description}</p>
              <div className="mt-2 flex gap-1">
                {preset.hours.map((h, j) => (
                  <span
                    key={j}
                    className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600"
                  >
                    {h < 24 ? `${h}h` : `${Math.round(h / 24)}d`}
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      <button className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
        Save schedule
      </button>
    </div>
  );
}

function DunningTemplatesCard() {
  const defaultTemplates = [
    { step: 1, name: "Payment failed", delay: "1 hour", channel: "email" },
    { step: 2, name: "Payment reminder", delay: "3 days", channel: "email" },
    { step: 3, name: "Final notice", delay: "7 days", channel: "email" },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
            <Mail className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Dunning templates
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Customize recovery emails sent to customers
            </p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50">
          <Plus className="h-3 w-3" />
          Add step
        </button>
      </div>

      <div className="space-y-2">
        {defaultTemplates.map((template) => (
          <div
            key={template.step}
            className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-600">
                {template.step}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {template.name}
                </p>
                <p className="text-xs text-gray-500">
                  {template.channel} - sent after {template.delay}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-rose-600">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure your recovery preferences
        </p>
      </div>

      <div className="space-y-6">
        <StripeConnectionCard />
        <RetryScheduleCard />
        <DunningTemplatesCard />
      </div>
    </div>
  );
}
