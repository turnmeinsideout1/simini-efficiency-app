export function escapeCsvField(value: unknown): string {
  if (value == null) return "";
  const str = value instanceof Date ? value.toISOString() : String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const header = columns.map(escapeCsvField).join(",");
  const body = rows.map((row) =>
    columns.map((col) => escapeCsvField(row[col])).join(",")
  );
  return [header, ...body].join("\r\n");
}
