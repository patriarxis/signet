import { html as beautifyHtml } from "js-beautify";

const STYLE_ATTR = 'style="';

/**
 * No tags are treated as inline — every element should land on its own row
 * in the code editor for readability.
 */
const BASE_OPTIONS = {
  indent_size: 2,
  indent_char: " ",
  preserve_newlines: false,
  max_preserve_newlines: 1,
  wrap_line_length: 0,
  wrap_attributes: "force-aligned" as const,
  end_with_newline: false,
  extra_liners: [] as string[],
  unformatted: [] as string[],
  content_unformatted: ["pre", "textarea", "script", "style"],
  inline: [] as string[],
  indent_inner_html: true,
};

/** Split on `;` while ignoring separators inside parentheses. */
function splitDeclarations(value: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";

  for (const char of value) {
    if (char === "(") depth += 1;
    if (char === ")") depth = Math.max(0, depth - 1);

    if (char === ";" && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  parts.push(current);

  return parts.map((part) => part.trim()).filter(Boolean);
}

/**
 * Stack CSS declarations one per line, aligned under the opening quote —
 * mirroring how attributes are aligned.
 */
function expandStyleInLine(line: string): string {
  const start = line.indexOf(STYLE_ATTR);
  if (start === -1) return line;

  const valueStart = start + STYLE_ATTR.length;
  const valueEnd = line.indexOf('"', valueStart);
  if (valueEnd === -1) return line;

  const declarations = splitDeclarations(line.slice(valueStart, valueEnd));
  if (declarations.length < 2) return line;

  const before = line.slice(0, start);
  const after = line.slice(valueEnd + 1);
  const pad = " ".repeat(before.length + STYLE_ATTR.length);

  const body = declarations
    .map((declaration, index) =>
      index === 0 ? `${declaration};` : `${pad}${declaration};`,
    )
    .join("\n");

  return `${before}${STYLE_ATTR}${body}"${after}`;
}

function expandStyleAttributes(source: string): string {
  let result = source;

  for (let pass = 0; pass < 3; pass += 1) {
    result = result.split("\n").map(expandStyleInLine).join("\n");
  }

  return result;
}

/**
 * Guarantee every tag sits on its own row. Preserves the leading indent of
 * the original line for each newly split piece.
 */
function isolateElements(source: string): string {
  return source
    .split("\n")
    .flatMap((line) => {
      // Split adjacent tags: `</a><span` or `"><span`
      if (/>\s*</.test(line)) {
        const indent = line.match(/^\s*/)?.[0] ?? "";
        return line
          .split(/(?<=>)\s*(?=<)/)
          .map((part, index) =>
            index === 0 ? part : `${indent}${part.trimStart()}`,
          );
      }

      // After a stacked style, break text + closing tag onto their own rows:
      // `color: #333;">Phone</a>` → `color: #333;">` / `Phone` / `</a>`
      const styleClose = line.match(/^(.*?)">(.+)$/);
      if (styleClose && /<\/[a-zA-Z]/.test(styleClose[2])) {
        const indent = line.match(/^\s*/)?.[0] ?? "";
        const contentIndent = `${indent}  `;
        const [, before, rest] = styleClose;
        const closeMatch = rest.match(/^(.*?)(<\/[a-zA-Z][^>]*>)\s*$/);
        if (closeMatch) {
          const text = closeMatch[1].trim();
          const close = closeMatch[2];
          const rows = [`${before}">`];
          if (text) rows.push(`${contentIndent}${text}`);
          rows.push(`${indent}${close}`);
          return rows;
        }
      }

      return [line];
    })
    .join("\n");
}

export function formatHtml(source: string): string {
  try {
    let formatted = beautifyHtml(source, BASE_OPTIONS);
    formatted = isolateElements(formatted);
    formatted = expandStyleAttributes(formatted);
    // Style expansion can leave `">...</tag>` on the same line — split again.
    return isolateElements(formatted);
  } catch {
    return source;
  }
}
