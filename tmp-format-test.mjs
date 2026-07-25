import pkg from "js-beautify";
const { html: beautifyHtml } = pkg;

const INLINE_TAGS = [
  "span",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "small",
  "sub",
  "sup",
  "br",
  "wbr",
];

function formatHtml(source) {
  const options = {
    indent_size: 2,
    indent_char: " ",
    max_preserve_newlines: 1,
    preserve_newlines: false,
    wrap_line_length: 120,
    wrap_attributes: "force-aligned",
    end_with_newline: false,
    extra_liners: [],
    unformatted: [],
    content_unformatted: ["pre", "textarea", "script", "style"],
    inline: INLINE_TAGS,
    indent_inner_html: true,
  };

  let formatted = beautifyHtml(source, options);
  formatted = formatted.replace(/>(?=<)/g, ">\n");
  return beautifyHtml(formatted, { ...options, preserve_newlines: true });
}

const sample = `<td style="padding-top: 12px; padding-bottom: 12px;"><a href="https://" style="display: block; text-decoration: none; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: rgb(51, 51, 51); margin-bottom: 4px;">Link</a><a href="https://" style="display: block; text-decoration: none; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: rgb(51, 51, 51); margin-bottom: 4px;">Link</a><a href="https://" style="display: block; text-decoration: none; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: rgb(51, 51, 51); margin-bottom: 4px;">Link</a></td>`;

console.log(formatHtml(sample));
