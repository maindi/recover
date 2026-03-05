import Link from "next/link";
import {
  ArrowRight,
  Zap,
  BarChart3,
  Mail,
  Shield,
  Clock,
  RefreshCw,
  Check,
} from "lucide-react";

function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-gray-200/60 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
            <span className="text-xs font-bold text-white">R</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">Recover</span>
        </Link>
        <div className="hidden items-center gap-8 text-sm md:flex">
          <a href="#features" className="text-gray-600 hover:text-gray-900">
            Features
          </a>
          <a href="#pricing" className="text-gray-600 hover:text-gray-900">
            Pricing
          </a>
          <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">
            How it works
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,rgba(99,102,241,0.08),transparent)]" />
      <div className="mx-auto max-w-4xl px-6 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          <Zap className="h-3 w-3" />
          AI-powered payment recovery
        </div>
        <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-gray-900 md:text-6xl">
          Stop losing revenue to
          <br />
          <span className="text-indigo-600">failed payments</span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600">
          Recover automatically detects failed Stripe payments, retries them at
          the optimal time, and sends personalized dunning emails. Recover
          50-80% of involuntary churn.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/sign-up"
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            Start recovering for free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#how-it-works"
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            See how it works
          </a>
        </div>
        <p className="mt-4 text-xs text-gray-500">
          Free to start. Only pay when we recover your revenue.
        </p>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { value: "9%", label: "of MRR lost to failed payments on average" },
    { value: "55%+", label: "recovery rate with smart retries" },
    { value: "<5 min", label: "to connect and start recovering" },
  ];

  return (
    <section className="border-y border-gray-200 bg-gray-50 py-12">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-6 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className="mt-1 text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: RefreshCw,
      title: "Smart retries",
      description:
        "ML-optimized retry timing based on decline codes, time of day, and payment patterns. Hard declines skip retries and go straight to card update.",
    },
    {
      icon: Mail,
      title: "Dunning emails",
      description:
        "3-step email sequence with customizable templates. Automatically includes Stripe Billing Portal links for easy card updates.",
    },
    {
      icon: BarChart3,
      title: "Recovery dashboard",
      description:
        "Real-time metrics on MRR saved, recovery rate, and active campaigns. Track every payment event from failure to recovery.",
    },
    {
      icon: Zap,
      title: "5-minute setup",
      description:
        "Connect your Stripe account with OAuth and start recovering immediately. We configure webhooks and default retry schedules for you.",
    },
    {
      icon: Shield,
      title: "Secure by design",
      description:
        "Never touches card numbers. All payment operations go through Stripe. PCI SAQ-A compliant with encrypted data at rest.",
    },
    {
      icon: Clock,
      title: "Time-of-day optimization",
      description:
        "Retries are scheduled at times with historically highest success rates. Payday-aware for B2C, business-hours-aware for B2B.",
    },
  ];

  return (
    <section id="features" className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Everything you need to recover revenue
          </h2>
          <p className="mt-3 text-gray-600">
            Intelligent payment recovery that works while you sleep
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-sm"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                <feature.icon className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      step: "1",
      title: "Connect Stripe",
      description:
        "One-click OAuth connection. We automatically register webhooks and start monitoring your payments.",
    },
    {
      step: "2",
      title: "We detect failures",
      description:
        "When a payment fails, we classify the decline, create a recovery campaign, and schedule smart retries.",
    },
    {
      step: "3",
      title: "Automatic recovery",
      description:
        "Retries are executed at optimal times. Customers get dunning emails with card update links. Revenue recovered.",
    },
  ];

  return (
    <section id="how-it-works" className="border-t border-gray-200 bg-gray-50 py-20">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900">How it works</h2>
          <p className="mt-3 text-gray-600">
            Start recovering revenue in under 5 minutes
          </p>
        </div>
        <div className="space-y-8">
          {steps.map((step) => (
            <div key={step.step} className="flex gap-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                {step.step}
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "Free",
      fee: "25% of recovered",
      description: "For early-stage startups",
      mrr: "Up to $100K MRR",
      features: [
        "Smart retry engine",
        "3-step dunning emails",
        "Recovery dashboard",
        "Stripe integration",
      ],
      cta: "Get started",
      highlighted: false,
    },
    {
      name: "Growth",
      price: "$99",
      fee: "15% of recovered",
      description: "For growing businesses",
      mrr: "Up to $500K MRR",
      features: [
        "Everything in Starter",
        "Custom dunning templates",
        "SMS notifications",
        "Advanced analytics",
        "Priority support",
      ],
      cta: "Get started",
      highlighted: true,
    },
    {
      name: "Scale",
      price: "$249",
      fee: "10% of recovered",
      description: "For scaling companies",
      mrr: "Up to $2M MRR",
      features: [
        "Everything in Growth",
        "ML-optimized retries",
        "Custom integrations",
        "Dedicated account manager",
        "SLA guarantee",
      ],
      cta: "Contact us",
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Simple, value-based pricing
          </h2>
          <p className="mt-3 text-gray-600">
            Only pay when we recover your revenue. No recovery, no fee.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-6 ${
                plan.highlighted
                  ? "border-indigo-200 bg-indigo-50/30 shadow-sm"
                  : "border-gray-200 bg-white"
              }`}
            >
              {plan.highlighted && (
                <span className="mb-3 inline-block rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-gray-900">
                {plan.name}
              </h3>
              <p className="text-xs text-gray-500">{plan.description}</p>
              <div className="mt-4 mb-1">
                <span className="text-3xl font-bold text-gray-900">
                  {plan.price}
                </span>
                {plan.price !== "Free" && (
                  <span className="text-sm text-gray-500">/mo</span>
                )}
              </div>
              <p className="mb-4 text-xs text-gray-500">
                + {plan.fee} | {plan.mrr}
              </p>
              <Link
                href="/sign-up"
                className={`block w-full rounded-lg px-4 py-2.5 text-center text-sm font-medium transition-colors ${
                  plan.highlighted
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {plan.cta}
              </Link>
              <ul className="mt-5 space-y-2.5">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <Check className="h-3.5 w-3.5 text-indigo-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600">
            <span className="text-[10px] font-bold text-white">R</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">Recover</span>
        </div>
        <p className="text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Recover. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Pricing />
      <Footer />
    </div>
  );
}
