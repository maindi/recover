export default function OverviewPage() {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold">Recovery overview</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-gray-500">MRR saved</p>
          <p className="text-3xl font-bold">$0</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-gray-500">Recovery rate</p>
          <p className="text-3xl font-bold">0%</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-gray-500">Active campaigns</p>
          <p className="text-3xl font-bold">0</p>
        </div>
      </div>
    </div>
  );
}
