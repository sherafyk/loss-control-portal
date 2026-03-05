"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { parseMarkdownTable, makeEmptyMarkdownTable, isProbablyMarkdownTable } from "@/lib/markdownTable";

type TemplateBlock =
  | { block_type: "heading"; heading_level: number; title: string }
  | { block_type: "table"; table_type: string; markdown: string }
  | { block_type: "note"; markdown: string };

function standardTemplateBlocks(): TemplateBlock[] {
  // NOTE: These are *report section headings* you requested, with empty Markdown tables under each section.
  // Admins can paste the real Markdown tables to replace the empty ones.
  return [
    { block_type: "heading", heading_level: 2, title: "Barge Inventory" },

    { block_type: "heading", heading_level: 3, title: "Arrival Condition" },
    {
      block_type: "table",
      table_type: "barge_inventory_arrival_condition",
      markdown: makeEmptyMarkdownTable([
        "Tank",
        "Product Name",
        "A. P. I",
        "Ullage (Ft.)",
        "Ullage (in.)",
        "Temp (F)",
        "Water (Bbls)",
        "Gross Bbls",
        "Net Bbls",
        "Metric Tons"
      ])
    },

    { block_type: "heading", heading_level: 3, title: "Summary of Arrival Condition" },
    {
      block_type: "table",
      table_type: "barge_inventory_summary_arrival",
      markdown: makeEmptyMarkdownTable(["Product", "A. P. I", "Gross Bbls", "Net Bbls", "Metric Tons"])
    },

    { block_type: "heading", heading_level: 3, title: "Departure Condition" },
    {
      block_type: "table",
      table_type: "barge_inventory_departure_condition",
      markdown: makeEmptyMarkdownTable([
        "Tank",
        "Product Name",
        "A. P. I",
        "Ullage (Ft.)",
        "Ullage (in.)",
        "Temp (F)",
        "Water (Bbls)",
        "Gross Bbls",
        "Net Bbls",
        "Metric Tons"
      ])
    },

    { block_type: "heading", heading_level: 3, title: "Summary of Departure Condition" },
    {
      block_type: "table",
      table_type: "barge_inventory_summary_departure",
      markdown: makeEmptyMarkdownTable(["Product", "A. P. I", "Gross Bbls", "Net Bbls", "Metric Tons"])
    },

    { block_type: "heading", heading_level: 3, title: "Products Loaded (–) / Discharged (+)" },
    {
      block_type: "table",
      table_type: "barge_inventory_products_loaded_discharged",
      markdown: makeEmptyMarkdownTable(["Product", "A. P. I", "Gross Bbls", "Net Bbls", "Metric Tons"])
    },

    { block_type: "heading", heading_level: 3, title: "Draft Readings (Arrival & Departure)" },

    { block_type: "heading", heading_level: 4, title: "Arrival Drafts (decimal feet)" },
    {
      block_type: "table",
      table_type: "barge_inventory_arrival_drafts",
      markdown: makeEmptyMarkdownTable(["Draft", "Port (ft)", "Stbd (ft)"])
    },

    { block_type: "heading", heading_level: 4, title: "Departure Drafts (decimal feet)" },
    {
      block_type: "table",
      table_type: "barge_inventory_departure_drafts",
      markdown: makeEmptyMarkdownTable(["Draft", "Port (ft)", "Stbd (ft)"])
    },

    { block_type: "heading", heading_level: 4, title: "Water Sp. Gravity" },
    {
      block_type: "table",
      table_type: "barge_inventory_water_sp_gravity",
      markdown: makeEmptyMarkdownTable(["Water Type", "Specific Gravity"])
    },

    { block_type: "heading", heading_level: 3, title: "Time Log" },
    {
      block_type: "table",
      table_type: "barge_inventory_time_log",
      markdown: makeEmptyMarkdownTable(["Event", "Date", "Time"])
    },

    { block_type: "heading", heading_level: 2, title: "Delivery Note" },

    { block_type: "heading", heading_level: 3, title: "Product Details" },
    {
      block_type: "table",
      table_type: "delivery_note_product_details",
      markdown: makeEmptyMarkdownTable([
        "Product",
        "Weight (MT)",
        "Gross Bbls",
        "Net Bbls",
        "API",
        "Density @ 15°C",
        "Visc CST @ 50°C",
        "Temp (°C)",
        "Flash (°C)",
        "Pour (°C)",
        "Sulfur % wt"
      ])
    },

    { block_type: "heading", heading_level: 3, title: "Sample Seal Numbers" },
    {
      block_type: "table",
      table_type: "delivery_note_sample_seal_numbers",
      markdown: makeEmptyMarkdownTable(["Role", "Product", "Seal Number"])
    },

    { block_type: "heading", heading_level: 3, title: "Operations / Time Log" },
    {
      block_type: "table",
      table_type: "delivery_note_operations_time_log",
      markdown: makeEmptyMarkdownTable(["Event", "Date", "Time"])
    },

    { block_type: "heading", heading_level: 3, title: "Compliance Notes" },
    { block_type: "note", markdown: "_Enter compliance notes here._" },

    { block_type: "heading", heading_level: 2, title: "Survey Report" },

    { block_type: "heading", heading_level: 3, title: "Arrival Quantities / OBQ" },
    {
      block_type: "table",
      table_type: "survey_report_arrival_obq",
      markdown: makeEmptyMarkdownTable([
        "Tank",
        "Ref.Hgt (Ft)",
        "Ullage (Ft)",
        "F.H2O (Ft)",
        "TOV Bbls",
        "H2O Bbls",
        "GOV Bbls",
        "Temp. °F",
        "VCF 6B",
        "GSV Bbls"
      ])
    },

    { block_type: "heading", heading_level: 3, title: "Departure Quantities / ROB" },
    {
      block_type: "table",
      table_type: "survey_report_departure_rob",
      markdown: makeEmptyMarkdownTable([
        "Tank",
        "Ref.Hgt (Ft)",
        "Ullage (Ft)",
        "F.H2O (Ft)",
        "TOV Bbls",
        "H2O Bbls",
        "GOV Bbls",
        "Temp. °F",
        "VCF 6B",
        "GSV Bbls"
      ])
    },

    { block_type: "heading", heading_level: 3, title: "Event Time Log" },
    {
      block_type: "table",
      table_type: "survey_report_event_time_log",
      markdown: makeEmptyMarkdownTable(["Date", "Time", "Event"])
    },

    { block_type: "heading", heading_level: 3, title: "Delivered Quantities" },
    {
      block_type: "table",
      table_type: "survey_report_delivered_quantities",
      markdown: makeEmptyMarkdownTable(["Metric", "Value", "Unit"])
    },

    { block_type: "heading", heading_level: 3, title: "Remarks / Notes" },
    { block_type: "note", markdown: "_Enter remarks / notes here._" },

    { block_type: "heading", heading_level: 2, title: "Environment and Survey Variables" },

    { block_type: "heading", heading_level: 3, title: "Ambient Temperature Open" },
    { block_type: "table", table_type: "env_ambient_open", markdown: makeEmptyMarkdownTable(["Value"]) },

    { block_type: "heading", heading_level: 3, title: "Ambient Temperature Close" },
    { block_type: "table", table_type: "env_ambient_close", markdown: makeEmptyMarkdownTable(["Value"]) },

    { block_type: "heading", heading_level: 3, title: "sVar Delivery" },
    { block_type: "table", table_type: "env_svar_delivery", markdown: makeEmptyMarkdownTable(["Value"]) },

    { block_type: "heading", heading_level: 3, title: "sVar Upstream" },
    { block_type: "table", table_type: "env_svar_upstream", markdown: makeEmptyMarkdownTable(["Value"]) },

    { block_type: "heading", heading_level: 3, title: "sVar Net" },
    { block_type: "table", table_type: "env_svar_net", markdown: makeEmptyMarkdownTable(["Value"]) },

    { block_type: "heading", heading_level: 3, title: "cVar Alpha" },
    { block_type: "table", table_type: "env_cvar_alpha", markdown: makeEmptyMarkdownTable(["Value"]) },

    { block_type: "heading", heading_level: 3, title: "cVar Beta" },
    { block_type: "table", table_type: "env_cvar_beta", markdown: makeEmptyMarkdownTable(["Value"]) }
  ];
}

export async function generateStandardTemplate(jobId: string, jobCode: string) {
  await requireAdmin();
  const supabase = supabaseServer();

  const { data: existing } = await supabase
    .from("report_blocks")
    .select("id")
    .eq("job_id", jobId)
    .limit(1);

  if ((existing ?? []).length > 0) {
    // Don't overwrite; admin can delete blocks if they want a reset.
    redirect(`/admin/jobs/${encodeURIComponent(jobCode)}/report?info=template_exists`);
  }

  const blocks = standardTemplateBlocks();
  const rows = blocks.map((b, idx) => {
    const sort_order = (idx + 1) * 10;
    if (b.block_type === "heading") {
      return {
        job_id: jobId,
        sort_order,
        block_type: "heading",
        heading_level: b.heading_level,
        title: b.title,
        table_type: null,
        markdown: ""
      };
    }
    if (b.block_type === "table") {
      return {
        job_id: jobId,
        sort_order,
        block_type: "table",
        heading_level: null,
        title: null,
        table_type: b.table_type,
        markdown: b.markdown
      };
    }
    return {
      job_id: jobId,
      sort_order,
      block_type: "note",
      heading_level: null,
      title: null,
      table_type: null,
      markdown: b.markdown
    };
  });

  const { error } = await supabase.from("report_blocks").insert(rows);
  if (error) throw new Error(`Failed to generate template: ${error.message}`);

  revalidatePath(`/admin/jobs/${encodeURIComponent(jobCode)}/report`);
  redirect(`/admin/jobs/${encodeURIComponent(jobCode)}/report`);
}

const updateBlockSchema = z.object({
  title: z.string().optional(),
  heading_level: z.string().optional(),
  markdown: z.string().optional()
});

export async function updateReportBlock(blockId: string, jobCode: string, formData: FormData) {
  await requireAdmin();
  const supabase = supabaseServer();

  const parsed = updateBlockSchema.parse({
    title: formData.get("title")?.toString(),
    heading_level: formData.get("heading_level")?.toString(),
    markdown: formData.get("markdown")?.toString()
  });

  // Fetch block to know type
  const { data: block, error: blockErr } = await supabase
    .from("report_blocks")
    .select("id,block_type,table_type")
    .eq("id", blockId)
    .single();

  if (blockErr) throw new Error(`Block not found: ${blockErr.message}`);

  const updates: any = {};

  if (block.block_type === "heading") {
    updates.title = parsed.title ?? "";
    updates.heading_level = parsed.heading_level ? Number(parsed.heading_level) : 2;
  } else {
    updates.markdown = parsed.markdown ?? "";
  }

  const { error } = await supabase.from("report_blocks").update(updates).eq("id", blockId);
  if (error) throw new Error(`Failed to update block: ${error.message}`);

  // Parse tables into JSONB for analytics use later (and validation).
  if (block.block_type === "table") {
    const markdown = (parsed.markdown ?? "").trim();
    let headers: string[] | null = null;
    let rows: any[] | null = null;
    let parseError: string | null = null;

    if (markdown.length === 0) {
      parseError = "Empty table.";
    } else if (!isProbablyMarkdownTable(markdown)) {
      parseError = "Not recognized as a Markdown table (missing '|' or separator row).";
    } else {
      try {
        const parsedTable = parseMarkdownTable(markdown);
        headers = parsedTable.headers;
        rows = parsedTable.rows;
      } catch (e: any) {
        parseError = e?.message ?? "Failed to parse table.";
      }
    }

    const { error: upErr } = await supabase.from("report_table_parses").upsert(
      {
        report_block_id: blockId,
        table_type: block.table_type,
        headers,
        rows,
        parse_error: parseError,
        parsed_at: new Date().toISOString()
      },
      { onConflict: "report_block_id" }
    );

    if (upErr) throw new Error(`Failed to store parsed table: ${upErr.message}`);
  }

  revalidatePath(`/admin/jobs/${encodeURIComponent(jobCode)}/report`);
}

export async function deleteReportBlock(blockId: string, jobCode: string) {
  await requireAdmin();
  const supabase = supabaseServer();

  // Delete parse first (if exists), then block.
  await supabase.from("report_table_parses").delete().eq("report_block_id", blockId);
  const { error } = await supabase.from("report_blocks").delete().eq("id", blockId);
  if (error) throw new Error(`Failed to delete block: ${error.message}`);

  revalidatePath(`/admin/jobs/${encodeURIComponent(jobCode)}/report`);
}

const addBlockSchema = z.object({
  block_type: z.enum(["heading", "table", "note"]),
  heading_level: z.string().optional(),
  title: z.string().optional(),
  table_type: z.string().optional(),
  markdown: z.string().optional(),
  sort_order: z.string().optional()
});

export async function addReportBlock(jobId: string, jobCode: string, formData: FormData) {
  await requireAdmin();
  const supabase = supabaseServer();

  const parsed = addBlockSchema.parse({
    block_type: formData.get("block_type")?.toString(),
    heading_level: formData.get("heading_level")?.toString(),
    title: formData.get("title")?.toString(),
    table_type: formData.get("table_type")?.toString(),
    markdown: formData.get("markdown")?.toString(),
    sort_order: formData.get("sort_order")?.toString()
  });

  const sortOrder = parsed.sort_order ? Number(parsed.sort_order) : 9999;

  const row: any = {
    job_id: jobId,
    sort_order: sortOrder,
    block_type: parsed.block_type
  };

  if (parsed.block_type === "heading") {
    row.heading_level = parsed.heading_level ? Number(parsed.heading_level) : 3;
    row.title = parsed.title ?? "New Heading";
    row.table_type = null;
    row.markdown = "";
  } else if (parsed.block_type === "table") {
    row.heading_level = null;
    row.title = null;
    row.table_type = parsed.table_type ?? "custom_table";
    row.markdown = parsed.markdown ?? makeEmptyMarkdownTable(["Column 1", "Column 2"]);
  } else {
    row.heading_level = null;
    row.title = null;
    row.table_type = null;
    row.markdown = parsed.markdown ?? "_New note._";
  }

  const { error } = await supabase.from("report_blocks").insert(row);
  if (error) throw new Error(`Failed to add block: ${error.message}`);

  revalidatePath(`/admin/jobs/${encodeURIComponent(jobCode)}/report`);
}
