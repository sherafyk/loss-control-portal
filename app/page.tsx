export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-semibold">Deployable Loss Control Portal</h1>
        <p className="mt-2 text-slate-700">
          This repository implements:
        </p>
        <ul className="mt-3 list-disc pl-6 text-slate-700 space-y-1">
          <li>A surveyor input form (creates a job on first upload)</li>
          <li>Google Drive uploads (files are stored in Drive, DB stores references)</li>
          <li>Admin report editor using Markdown blocks (paste Markdown tables)</li>
          <li>Client view with vessel history (no client logins; access via vessel key)</li>
        </ul>

        <div className="mt-6 flex flex-wrap gap-3">
          <a className="rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800" href="/auth/login">
            Login
          </a>
          <a className="rounded border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 hover:bg-slate-50" href="/surveyor">
            Surveyor Dashboard
          </a>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">What to do next</h2>
        <ol className="mt-3 list-decimal pl-6 text-slate-700 space-y-1">
          <li>Set up Supabase (run <code>supabase/schema.sql</code>).</li>
          <li>Set up Google Drive API (service account + share the folder).</li>
          <li>Deploy to Vercel (set environment variables).</li>
        </ol>
        <p className="mt-3 text-slate-700">
          See <code>README.md</code> for step-by-step instructions.
        </p>
      </div>
    </div>
  );
}
