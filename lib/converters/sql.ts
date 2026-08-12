/**
 * lib/converters/sql.ts
 *
 * JSON → SQL DDL (CREATE TABLE) & DML (INSERT INTO) statement generator.
 */

export interface SqlOptions {
  tableName?: string;
  dialect?: "postgresql" | "mysql" | "sqlite";
}

export function convertJsonToSql(jsonText: string, options: SqlOptions = {}): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    return `-- Invalid JSON input\n-- ${err instanceof Error ? err.message : String(err)}`;
  }

  const tableName = options.tableName || "my_table";
  const dialect = options.dialect || "postgresql";

  let items: Record<string, unknown>[] = [];
  if (Array.isArray(parsed)) {
    items = parsed.map((item) => (typeof item === "object" && item !== null ? (item as Record<string, unknown>) : { value: item }));
  } else if (typeof parsed === "object" && parsed !== null) {
    items = [parsed as Record<string, unknown>];
  } else {
    items = [{ value: parsed }];
  }

  if (items.length === 0) return "-- Empty dataset";

  // Deduplicate column definitions
  const columnsMap = new Map<string, string>();
  for (const item of items) {
    for (const [k, v] of Object.entries(item)) {
      if (!columnsMap.has(k)) {
        columnsMap.set(k, inferSqlType(v, dialect));
      }
    }
  }

  const colNames = Array.from(columnsMap.keys());
  const ddlLines: string[] = [];
  ddlLines.push(`CREATE TABLE IF NOT EXISTS ${tableName} (`);
  ddlLines.push(colNames.map((col) => `    ${sanitizeCol(col)} ${columnsMap.get(col)}`).join(",\n"));
  ddlLines.push(");\n");

  const dmlLines: string[] = [];
  const colList = colNames.map(sanitizeCol).join(", ");

  for (const item of items) {
    const valList = colNames.map((col) => escapeSqlVal(item[col])).join(", ");
    dmlLines.push(`INSERT INTO ${tableName} (${colList}) VALUES (${valList});`);
  }

  return ddlLines.join("\n") + dmlLines.join("\n");
}

function inferSqlType(val: unknown, dialect: string): string {
  if (typeof val === "number") {
    return Number.isInteger(val) ? "INT" : dialect === "postgresql" ? "DOUBLE PRECISION" : "REAL";
  }
  if (typeof val === "boolean") return dialect === "postgresql" ? "BOOLEAN" : "TINYINT(1)";
  if (typeof val === "object" && val !== null) return dialect === "postgresql" ? "JSONB" : "TEXT";
  return "VARCHAR(255)";
}

function sanitizeCol(col: string): string {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(col) ? col : `"${col}"`;
}

function escapeSqlVal(val: unknown): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number") return String(val);
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}
