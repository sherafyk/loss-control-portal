export default function SurveyorHome() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Create a new job</h2>
        <p className="mt-2 text-sm text-slate-700">
          Upload the first file (Initial Opening Figures). This creates the job code in the format
          <code className="mx-1 rounded bg-slate-100 px-1 py-0.5">YYYYMMDD-ABC</code>
          (ABC = 3-letter vessel code).
        </p>
        <a
          className="mt-4 inline-flex rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
          href="/surveyor/new"
        >
          New Job
        </a>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Update an existing job</h2>
        <p className="mt-2 text-sm text-slate-700">
          Surveyors can add additional uploads and notes for jobs created in the last 7 days.
        </p>
        <a
          className="mt-4 inline-flex rounded border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 hover:bg-slate-50"
          href="/surveyor/recent"
        >
          Recent Jobs
        </a>
      </div>
    </div>
  );
}
