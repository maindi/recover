export default function SettingsPage() {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold">Settings</h2>
      <div className="space-y-6">
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-2 font-medium">Stripe connection</h3>
          <p className="mb-4 text-sm text-gray-500">
            Connect your Stripe account to start recovering failed payments.
          </p>
          <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">
            Connect Stripe
          </button>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-2 font-medium">Retry schedule</h3>
          <p className="text-sm text-gray-500">
            Configure when and how often to retry failed payments.
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-2 font-medium">Dunning templates</h3>
          <p className="text-sm text-gray-500">
            Customize the emails sent to customers with failed payments.
          </p>
        </div>
      </div>
    </div>
  );
}
