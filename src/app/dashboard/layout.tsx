export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-xl font-semibold">Recover</h1>
          <div className="flex gap-6 text-sm">
            <a href="/dashboard/overview" className="text-gray-600 hover:text-gray-900">
              Overview
            </a>
            <a href="/dashboard/payments" className="text-gray-600 hover:text-gray-900">
              Payments
            </a>
            <a href="/dashboard/settings" className="text-gray-600 hover:text-gray-900">
              Settings
            </a>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl p-6">{children}</main>
    </div>
  );
}
