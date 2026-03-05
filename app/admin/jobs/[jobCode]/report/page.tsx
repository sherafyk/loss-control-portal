import { supabaseServer } from "@/lib/supabase/server";
import { addReportBlock, deleteReportBlock, generateStandardTemplate, updateReportBlock } from "@/lib/actions/report";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Markdown } from "@/components/Markdown";

export default async function AdminReportEditorPage({
  params,
  searchParams
}: {
  params: { jobCode: string };
  searchParams: { info?: string };
}) {
  const supabase = supabaseServer();

  const { data: job, error: jobErr } = await supabase
    .from("jobs")
    .select("id,job_code,delivery_date,vessel_code")
    .eq("job_code", params.jobCode)
    .single();

  if (jobErr || !job) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Job not found: {jobErr?.message ?? "Unknown error"}
      </div>
    );
  }

  const { data: blocks } = await supabase
    .from("report_blocks")
    .select("id,sort_order,block_type,heading_level,title,table_type,markdown")
    .eq("job_id", job.id)
    .order("sort_order", { ascending: true });

  const { data: parses } = await supabase
    .from("report_table_parses")
    .select("report_block_id,parse_error")
    .in("report_block_id", (blocks ?? []).map((b) => b.id));

  const parseByBlock = new Map<string, string | null>();
  (parses ?? []).forEach((p) => parseByBlock.set(p.report_block_id, p.parse_error));

  const hasBlocks = (blocks ?? []).length > 0;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Report Editor (Markdown blocks)</h1>
            <div className="text-sm text-slate-600">
              {job.job_code} • {job.delivery_date} • {job.vessel_code}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              className="rounded border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
              href={`/r/${encodeURIComponent(job.job_code)}`}
              target="_blank"
              rel="noreferrer"
            >
              Preview (client view)
            </a>
          </div>
        </div>

        {searchParams.info === "template_exists" ? (
          <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Template already exists for this job. To regenerate, delete existing blocks first.
          </div>
        ) : null}

        {!hasBlocks ? (
          <div className="mt-6 rounded border border-slate-200 p-4">
            <div className="font-medium">No report blocks yet.</div>
            <p className="mt-1 text-sm text-slate-600">
              Click below to generate your standard H2/H3/H4 structure with empty Markdown tables.
            </p>

            <form action={generateStandardTemplate.bind(null, job.id, job.job_code)} className="mt-4">
              <Button type="submit">Generate Standard Template</Button>
            </form>
          </div>
        ) : null}
      </div>

      {hasBlocks ? (
        <div className="space-y-4">
          {(blocks ?? []).map((b) => {
            const parseError = b.block_type === "table" ? (parseByBlock.get(b.id) ?? null) : null;

            return (
              <div key={b.id} className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-slate-600">
                    <span className="font-medium text-slate-900">#{b.sort_order}</span> • {b.block_type}
                    {b.block_type === "table" && b.table_type ? ` • ${b.table_type}` : ""}
                  </div>

                  <form action={deleteReportBlock.bind(null, b.id, job.job_code)}>
                    <Button type="submit" variant="danger">
                      Delete
                    </Button>
                  </form>
                </div>

                {b.block_type === "heading" ? (
                  <form action={updateReportBlock.bind(null, b.id, job.job_code)} className="mt-4 space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium">Heading title</label>
                        <Input name="title" defaultValue={b.title ?? ""} />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Heading level</label>
                        <Select name="heading_level" defaultValue={String(b.heading_level ?? 2)}>
                          <option value="2">H2</option>
                          <option value="3">H3</option>
                          <option value="4">H4</option>
                        </Select>
                      </div>
                    </div>
                    <Button type="submit" variant="secondary">
                      Save Heading
                    </Button>
                  </form>
                ) : (
                  <form action={updateReportBlock.bind(null, b.id, job.job_code)} className="mt-4 space-y-3">
                    <div>
                      <label className="text-sm font-medium">
                        {b.block_type === "table" ? "Markdown table" : "Markdown / text"}
                      </label>
                      <Textarea name="markdown" defaultValue={b.markdown} rows={8} className="mt-2 font-mono" />
                      {parseError ? (
                        <div className="mt-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                          Parse warning: {parseError}
                        </div>
                      ) : null}
                    </div>

                    <Button type="submit" variant="secondary">
                      Save Block
                    </Button>

                    <div className="mt-4 rounded border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs font-semibold text-slate-600">Preview</div>
                      <div className="mt-2">
                        <Markdown markdown={b.markdown} />
                      </div>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {hasBlocks ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Add block</h2>
          <form className="mt-4 space-y-4" action={addReportBlock.bind(null, job.id, job.job_code)}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Block type</label>
                <Select name="block_type" defaultValue="table">
                  <option value="heading">Heading</option>
                  <option value="table">Table</option>
                  <option value="note">Note</option>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Sort order</label>
                <Input name="sort_order" placeholder="e.g. 120" />
                <p className="mt-1 text-xs text-slate-500">
                  Lower numbers appear earlier. The template uses 10, 20, 30…
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Heading level (if heading)</label>
                <Select name="heading_level" defaultValue="3">
                  <option value="2">H2</option>
                  <option value="3">H3</option>
                  <option value="4">H4</option>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Heading title (if heading)</label>
                <Input name="title" placeholder="New section title" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Table type (if table)</label>
              <Input name="table_type" placeholder="custom_table" />
            </div>

            <div>
              <label className="text-sm font-medium">Markdown (if table or note)</label>
              <Textarea name="markdown" rows={6} className="mt-2 font-mono" placeholder="Paste markdown here..." />
            </div>

            <Button type="submit">Add Block</Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
