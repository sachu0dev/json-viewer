/**
 * lib/code-highlighter.ts
 *
 * Lightweight, zero-dependency theme-aware code tokenizer and syntax highlighter
 * supporting TypeScript, Python, Go, Rust, Java, C#, Swift, JS, CSV, YAML, XML, TOML, SQL.
 */

export interface CodeToken {
  text: string;
  type: "keyword" | "type" | "string" | "comment" | "annotation" | "number" | "boolean" | "punct" | "plain";
}

const KEYWORDS = new Set([
  "export", "interface", "type", "struct", "class", "record", "def", "fn", "pub", "use",
  "import", "from", "as", "package", "func", "val", "let", "const", "var", "return",
  "enum", "case", "table", "CREATE", "TABLE", "INSERT", "INTO", "VALUES", "IF", "NOT",
  "EXISTS", "SELECT", "FROM", "WHERE", "AND", "OR", "total", "Field", "alias"
]);

const TYPES = new Set([
  "string", "number", "boolean", "any", "void", "null", "float64", "bool", "int", "f64",
  "String", "Option", "Vec", "BaseModel", "List", "Dict", "Set", "Tuple", "Any", "TypedDict",
  "Double", "Boolean", "Object", "object", "VARCHAR", "INT", "JSONB", "TEXT", "REAL", "TINYINT",
  "Codable", "CodingKey", "CodingKeys", "Serialize", "Deserialize", "Debug", "JsonProperty"
]);

const BOOLEANS = new Set(["true", "false", "True", "False", "None", "null", "nil"]);

export function tokenizeCode(code: string): CodeToken[][] {
  const lines = code.split("\n");
  return lines.map(tokenizeLine);
}

function tokenizeLine(line: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  let i = 0;

  while (i < line.length) {
    // Comment
    if (line.startsWith("//", i) || line.startsWith("#", i) || line.startsWith("--", i) || line.startsWith("<!--", i)) {
      tokens.push({ text: line.slice(i), type: "comment" });
      break;
    }

    // Annotation / Decorator
    if (line[i] === "@" || line.startsWith("#[", i)) {
      let j = i + 1;
      while (j < line.length && /[a-zA-Z0-9_\(\)\[\]"=\s,]/.test(line[j])) {
        if (line[j] === "\n") break;
        j++;
      }
      tokens.push({ text: line.slice(i, j), type: "annotation" });
      i = j;
      continue;
    }

    // String literal
    if (line[i] === '"' || line[i] === "'" || line[i] === "`") {
      const quote = line[i];
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === quote && line[j - 1] !== "\\") {
          j++;
          break;
        }
        j++;
      }
      tokens.push({ text: line.slice(i, j), type: "string" });
      i = j;
      continue;
    }

    // Numbers
    if (/[0-9]/.test(line[i]) && (i === 0 || /[^a-zA-Z0-9_]/.test(line[i - 1]))) {
      let j = i;
      while (j < line.length && /[0-9\.]/.test(line[j])) j++;
      tokens.push({ text: line.slice(i, j), type: "number" });
      i = j;
      continue;
    }

    // Identifiers & Keywords
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) j++;
      const word = line.slice(i, j);

      if (KEYWORDS.has(word)) {
        tokens.push({ text: word, type: "keyword" });
      } else if (TYPES.has(word)) {
        tokens.push({ text: word, type: "type" });
      } else if (BOOLEANS.has(word)) {
        tokens.push({ text: word, type: "boolean" });
      } else {
        tokens.push({ text: word, type: "plain" });
      }
      i = j;
      continue;
    }

    // Punctuation
    if (/[{}()\[\];:,.<>=\-+*\/\\|!&%^~]/.test(line[i])) {
      tokens.push({ text: line[i], type: "punct" });
      i++;
      continue;
    }

    // Whitespace
    tokens.push({ text: line[i], type: "plain" });
    i++;
  }

  return tokens;
}
