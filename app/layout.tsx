import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Loss Control Portal",
  description: "Loss control + chain-of-custody portal (Supabase + Vercel + Google Drive)",
  robots: {
    index: false,
    follow: false
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-slate-900" />
                <div>
                  <div className="text-sm font-semibold leading-tight">Loss Control Portal</div>
                  <div className="text-xs text-slate-500 leading-tight">Survey uploads • Markdown reports • Vessel history</div>
                </div>
              </div>
              <nav className="flex items-center gap-4 text-sm">
                <a href="/" className="text-slate-700 hover:text-slate-900">Home</a>
                <a href="/auth/login" className="text-slate-700 hover:text-slate-900">Login</a>
                <a href="/surveyor" className="text-slate-700 hover:text-slate-900">Surveyor</a>
              </nav>
            </div>
          </header>

          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-slate-500">
              Not for public indexing. Access is controlled by login (surveyor/admin) or vessel access keys (client view).
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
