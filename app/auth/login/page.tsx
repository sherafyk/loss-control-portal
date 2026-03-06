import { LoginForm } from "./LoginForm";

type LoginPageProps = {
  searchParams?: {
    next?: string | string[];
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const rawNext = searchParams?.next;
  const nextPath =
    typeof rawNext === "string" && rawNext.trim().length > 0
      ? rawNext
      : "/surveyor";

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold">Login</h1>
        <p className="mt-1 text-sm text-slate-600">
          Surveyors and admins sign in with Supabase Auth (email + password).
        </p>

        <LoginForm nextPath={nextPath} />
      </div>
    </div>
  );
}