const MAX_BYTES = 1024 * 1024;
const MAX_ROWS = 2000;
const MAX_FIELD = 5000;
const allowedHeaders = new Set([
  "email",
  "job_title",
  "professional_level",
  "role_keys",
  "team_codes",
]);

export type MemberImportRow = {
  row: number;
  email: string;
  jobTitle?: string;
  professionalLevel?: string;
  roleKeys: string[];
  teamCodes: string[];
};
export type MemberImportIssue = { row: number; field: string; message: string };
export type MemberImportPreview = {
  rows: MemberImportRow[];
  issues: MemberImportIssue[];
  delimiter: "," | ";";
  valid: boolean;
};

function parseRecords(source: string, delimiter: "," | ";"): string[][] {
  const records: string[][] = [];
  let record: string[] = [], field = "", quoted = false;
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (quoted) {
      if (c === '"' && source[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"' && field.length === 0) quoted = true;
    else if (c === delimiter) { record.push(field); field = ""; }
    else if (c === "\n") { record.push(field.replace(/\r$/, "")); records.push(record); record = []; field = ""; }
    else field += c;
    if (field.length > MAX_FIELD) throw new Error("CSV_FIELD_TOO_LARGE");
  }
  if (quoted) throw new Error("CSV_QUOTE_UNCLOSED");
  record.push(field.replace(/\r$/, ""));
  if (record.some((value) => value.length > 0)) records.push(record);
  return records;
}

const clean = (value: string) => value.trim().normalize("NFC");
const list = (value: string) => [...new Set(value.split("|").map(clean).filter(Boolean))];

export function parseMemberImportCsv(input: string | Uint8Array): MemberImportPreview {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  if (bytes.byteLength === 0) throw new Error("CSV_EMPTY");
  if (bytes.byteLength > MAX_BYTES) throw new Error("CSV_TOO_LARGE");
  let source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (source.charCodeAt(0) === 0xfeff) source = source.slice(1);
  if (source.includes("\0")) throw new Error("CSV_CONTROL_CHARACTER");
  const firstLine = source.split(/\r?\n/, 1)[0];
  const delimiter: "," | ";" = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const records = parseRecords(source, delimiter);
  if (records.length < 2) throw new Error("CSV_DATA_REQUIRED");
  if (records.length - 1 > MAX_ROWS) throw new Error("CSV_TOO_MANY_ROWS");
  const headers = records[0].map((x) => clean(x).toLowerCase());
  if (new Set(headers).size !== headers.length || !headers.includes("email") || headers.some((x) => !allowedHeaders.has(x)))
    throw new Error("CSV_HEADERS_INVALID");
  const index = Object.fromEntries(headers.map((x, i) => [x, i]));
  const rows: MemberImportRow[] = [], issues: MemberImportIssue[] = [], emails = new Set<string>();
  const value = (record: string[], key: string) => clean(record[index[key]] ?? "");
  for (let i = 1; i < records.length; i++) {
    const record = records[i], row = i + 1;
    if (record.length !== headers.length) { issues.push({ row, field: "row", message: "Sütun sayısı başlıkla eşleşmiyor." }); continue; }
    const email = value(record, "email").toLowerCase();
    const roleKeys = list(value(record, "role_keys"));
    const teamCodes = list(value(record, "team_codes")).map((x) => x.toLowerCase());
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
      issues.push({ row, field: "email", message: "Geçerli bir e-posta gerekli." });
    if (emails.has(email)) issues.push({ row, field: "email", message: "Dosyada yinelenen e-posta." });
    emails.add(email);
    if (roleKeys.length === 0 || roleKeys.length > 5 || roleKeys.some((x) => !/^[a-z][a-z0-9_]{1,49}$/.test(x) || x === "platform_admin"))
      issues.push({ row, field: "role_keys", message: "1–5 geçerli tenant rolü gerekli." });
    if (teamCodes.length > 20 || teamCodes.some((x) => !/^[a-z][a-z0-9_-]{1,39}$/.test(x)))
      issues.push({ row, field: "team_codes", message: "Ekip kodları geçersiz." });
    for (const key of ["job_title", "professional_level"])
      if (value(record, key).length > 160 || /[\u0000-\u001f\u007f]/.test(value(record, key)))
        issues.push({ row, field: key, message: "Alan en fazla 160 güvenli karakter olabilir." });
    rows.push({ row, email, jobTitle: value(record, "job_title") || undefined,
      professionalLevel: value(record, "professional_level") || undefined, roleKeys, teamCodes });
  }
  const invalidRows = new Set(issues.map((x) => x.row));
  return { rows: rows.filter((x) => !invalidRows.has(x.row)), issues, delimiter, valid: issues.length === 0 };
}

export const memberImportTemplate = "email,job_title,professional_level,role_keys,team_codes\n";
