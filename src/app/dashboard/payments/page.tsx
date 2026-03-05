export default function PaymentsPage() {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold">Failed payments</h2>
      <div className="rounded-lg border bg-white p-6">
        <p className="text-gray-500">No failed payments yet. Connect your Stripe account to get started.</p>
      </div>
    </div>
  );
}
