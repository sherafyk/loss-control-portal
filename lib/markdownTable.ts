export type ParsedMarkdownTable = {
  headers: string[];
  rows: Record<string, string>[];
};

export function isProbablyMarkdownTable(text: string): boolean {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return false;
  const hasPipes = lines[0].includes("|") && lines[1].includes("|");
  const hasSeparator = /---/.test(lines[1]);
  return hasPipes && hasSeparator;
}

function splitRow(line: string): string[] {
  // Remove leading/trailing pipes if present.
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((c) => c.trim());
}

export function parseMarkdownTable(markdown: string): ParsedMarkdownTable {
  const lines = markdown
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    throw new Error("Table must have at least a header row and a separator row.");
  }

  const headerCells = splitRow(lines[0]);
  const separatorCells = splitRow(lines[1]);

  if (headerCells.length < 2) {
    throw new Error("Table header must have at least 2 columns.");
  }

  if (separatorCells.length !== headerCells.length) {
    // Many markdown tables still work even if separator count mismatches,
    // but for parsing we enforce consistency.
    throw new Error("Separator column count does not match header column count.");
  }

  const rows: Record<string, string>[] = [];

  for (const line of lines.slice(2)) {
    const cells = splitRow(line);
    if (cells.length !== headerCells.length) {
      throw new Error(
        `Row has ${cells.length} cells but header has ${headerCells.length}. Row: "${line}"`
      );
    }
    const row: Record<string, string> = {};
    headerCells.forEach((h, idx) => {
      row[h] = cells[idx] ?? "";
    });
    rows.push(row);
  }

  return { headers: headerCells, rows };
}

export function makeEmptyMarkdownTable(headers: string[]): string {
  const headerLine = `| ${headers.join(" | ")} |`;
  const separatorLine = `| ${headers.map(() => "---").join(" | ")} |`;
  const emptyLine = `| ${headers.map(() => " ").join(" | ")} |`;
  return [headerLine, separatorLine, emptyLine].join("\n");
}
