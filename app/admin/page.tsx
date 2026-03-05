export default function AdminHomePage() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold">Admin Tools</h1>
        <p className="mt-2 text-sm text-slate-700">
          Admins can edit report content (Markdown blocks) and manage vessel access keys for client views.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Vessel access keys</h2>
        <p className="mt-2 text-sm text-slate-700">
          Generate or rotate the long shared key that clients use to access vessel history and reports.
        </p>
        <a
          className="mt-4 inline-flex rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
          href="/admin/vessels"
        >
          Manage Keys
        </a>
      </div>
    </div>
  );
}
