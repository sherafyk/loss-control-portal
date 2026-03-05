import { Markdown } from "@/components/Markdown";

export type ReportBlock = {
  id: string;
  sort_order: number;
  block_type: "heading" | "table" | "note";
  heading_level: number | null;
  title: string | null;
  table_type: string | null;
  markdown: string;
};

function Heading({
  level,
  title
}: {
  level: number;
  title: string;
}) {
  if (level === 2) return <h2 className="mt-8 text-xl font-semibold">{title}</h2>;
  if (level === 3) return <h3 className="mt-6 text-lg font-semibold">{title}</h3>;
  if (level === 4) return <h4 className="mt-5 text-base font-semibold">{title}</h4>;
  return <div className="mt-4 font-semibold">{title}</div>;
}

export function ReportRenderer({ blocks }: { blocks: ReportBlock[] }) {
  return (
    <div className="space-y-3">
      {blocks
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((b) => {
          if (b.block_type === "heading") {
            return (
              <Heading
                key={b.id}
                level={b.heading_level ?? 2}
                title={b.title ?? ""}
              />
            );
          }

          if (b.block_type === "table") {
            return (
              <div key={b.id} className="rounded border border-slate-200 bg-white p-4">
                <Markdown markdown={b.markdown} />
              </div>
            );
          }

          // note
          return (
            <div key={b.id} className="rounded border border-slate-200 bg-white p-4">
              <Markdown markdown={b.markdown} />
            </div>
          );
        })}
    </div>
  );
}
