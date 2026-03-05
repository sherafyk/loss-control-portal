import { requireUser } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";

export default async function SurveyorLayout({ children }: { children: React.ReactNode }) {
  const { email, profile } = await requireUser();

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Surveyor Dashboard</div>
            <div className="text-xs text-slate-600">
              Signed in as {email ?? "Unknown"} {profile?.role ? `(${profile.role})` : ""}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              className="rounded border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
              href="/surveyor/new"
            >
              New Job
            </a>
            <a
              className="rounded border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
              href="/surveyor/recent"
            >
              Recent Jobs (7 days)
            </a>
            {profile?.role === "admin" ? (
              <a
                className="rounded border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                href="/admin"
              >
                Admin
              </a>
            ) : null}
            <SignOutButton />
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
