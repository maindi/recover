import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <main className="max-w-2xl text-center">
        <h1 className="mb-4 text-5xl font-bold tracking-tight">Recover</h1>
        <p className="mb-8 text-xl text-gray-600">
          AI-powered payment recovery for subscription businesses. Recover
          50-80% of failed payments automatically.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-lg bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700"
          >
            Go to dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
