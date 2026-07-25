export function sanitizeSignatureHtml(root: HTMLElement): string {
  const clone = root.cloneNode(true) as HTMLElement;

  // Vue uses comment anchors for v-if/v-for. They are implementation details
  // and must never appear in copied email HTML (for example <!--v-if-->).
  const comments = document.createTreeWalker(clone, NodeFilter.SHOW_COMMENT);
  const commentNodes: Comment[] = [];
  while (comments.nextNode()) {
    commentNodes.push(comments.currentNode as Comment);
  }
  commentNodes.forEach((comment) => comment.remove());

  clone.querySelectorAll("[data-signet-field]").forEach((node) => {
    const el = node as HTMLElement;
    const text = (el.textContent ?? "").replace(/\u00a0/g, " ").trim();

    if (!text) {
      const link = el.closest("[data-signet-link]");
      if (link) {
        const cell =
          link.parentElement?.tagName === "TD" ? link.parentElement : null;
        link.remove();
        removeEmptyLayoutCell(cell);
      } else {
        const cell =
          el.parentElement?.tagName === "TD" ? el.parentElement : null;
        el.remove();
        removeEmptyLayoutCell(cell);
      }
      return;
    }

    // Preserve per-signature presentation on an email-safe div (or keep text
    // inside a styled parent <a>), while removing the contenteditable host.
    const parent = el.parentNode;
    if (!parent) return;

    const inlineStyle = (el.getAttribute("style") ?? "").trim();
    const parentIsLink =
      parent instanceof HTMLElement &&
      (parent.hasAttribute("data-signet-link") || parent.tagName === "A");

    if (inlineStyle && !parentIsLink) {
      // Keep typography on a <div> — never invent a <span> for field styles.
      const wrapper = document.createElement("div");
      wrapper.setAttribute("style", inlineStyle);
      while (el.firstChild) {
        wrapper.appendChild(el.firstChild);
      }
      parent.replaceChild(wrapper, el);
      return;
    }

    while (el.firstChild) {
      parent.insertBefore(el.firstChild, el);
    }
    parent.removeChild(el);
  });

  clone.querySelectorAll("[data-signet-sep]").forEach((sep) => {
    // Separators may sit as siblings between <a>s, or alone in a <td>
    // between neighboring link cells (email-bulletproof social rows).
    const prev = sep.previousElementSibling;
    const next = sep.nextElementSibling;
    const siblingBetween =
      prev?.hasAttribute("data-signet-link") &&
      next?.hasAttribute("data-signet-link");

    const cell = sep.parentElement?.tagName === "TD" ? sep.parentElement : null;
    const prevCell = cell?.previousElementSibling ?? null;
    const nextCell = cell?.nextElementSibling ?? null;
    const cellBetween =
      !!prevCell?.querySelector("[data-signet-link]") &&
      !!nextCell?.querySelector("[data-signet-link]");

    if (!siblingBetween && !cellBetween) {
      if (cell) {
        const row = cell.parentElement;
        cell.remove();
        removeEmptyLayoutRow(row);
      } else {
        sep.remove();
      }
      return;
    }

    sep.removeAttribute("data-signet-sep");
    sep.setAttribute("aria-hidden", "true");
  });

  clone.querySelectorAll("[data-signet-image]").forEach((node) => {
    const el = node as HTMLElement;

    // Empty placeholder button used only in the editor — drop from copy.
    if (el.tagName === "BUTTON") {
      el.remove();
      return;
    }

    const img = el.querySelector("img");
    if (!img) {
      el.remove();
      return;
    }

    const width = el.dataset.signetImageWidth;
    const height = el.dataset.signetImageHeight;
    const radius = el.dataset.signetImageRadius;
    const declarations = (img.getAttribute("style") ?? "")
      .split(";")
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .filter(
        (declaration) =>
          !/^(width|height|border-radius)\s*:/i.test(declaration),
      );

    if (width) {
      declarations.push(`width: ${width}`);
      img.setAttribute("width", width.endsWith("px") ? width.slice(0, -2) : width);
    }
    if (height) {
      declarations.push(`height: ${height}`);
      img.setAttribute(
        "height",
        height.endsWith("px") ? height.slice(0, -2) : height,
      );
    }
    if (radius) declarations.push(`border-radius: ${radius}`);
    img.setAttribute("style", `${declarations.join("; ")};`);

    el.removeAttribute("data-signet-image");
    el.removeAttribute("data-signet-image-key");
    el.removeAttribute("data-signet-image-width");
    el.removeAttribute("data-signet-image-height");
    el.removeAttribute("data-signet-image-radius");
    el.removeAttribute("class");
    el.removeAttribute("role");
    el.removeAttribute("tabindex");

    // Unwrap non-link wrappers so copied markup is a bare <img>.
    if (el.tagName !== "A") {
      const parent = el.parentNode;
      if (parent) {
        parent.insertBefore(img, el);
        parent.removeChild(el);
      }
    } else {
      // The image itself carries the final dimensions. Avoid percentage
      // dimensions being applied twice through the editor wrapper.
      el.setAttribute(
        "style",
        "display: inline-block; text-decoration: none; line-height: 0;",
      );
    }
  });

  clone.querySelectorAll("[data-signet-link]").forEach((node) => {
    const el = node as HTMLElement;
    el.removeAttribute("data-signet-link");
    el.removeAttribute("title");
    el.removeAttribute("class");
  });

  clone.querySelectorAll("*").forEach((node) => {
    const el = node as HTMLElement;
    el.removeAttribute("data-placeholder");
    el.removeAttribute("contenteditable");
    el.removeAttribute("spellcheck");
    el.removeAttribute("title");

    for (const name of [...el.getAttributeNames()]) {
      if (name.startsWith("data-v-") || name.startsWith("data-signet")) {
        el.removeAttribute(name);
      }
    }

    if (el.getAttribute("class") === "") {
      el.removeAttribute("class");
    }
  });

  // Mark layout tables correctly for assistive technology and retain the
  // legacy attributes required by Outlook and older email clients.
  clone.querySelectorAll("table").forEach((table) => {
    table.setAttribute("role", "presentation");
    table.setAttribute("cellspacing", "0");
    table.setAttribute("cellpadding", "0");
    table.setAttribute("border", "0");

    const style = table.getAttribute("style") ?? "";
    const outlookSpacing =
      "mso-table-lspace: 0pt; mso-table-rspace: 0pt;";
    if (!style.includes("mso-table-lspace")) {
      table.setAttribute(
        "style",
        `${style.trim()}${style.trim() ? " " : ""}${outlookSpacing}`,
      );
    }
  });

  // Ensure images do not gain gaps, borders, or scaling artifacts in clients.
  clone.querySelectorAll("img").forEach((img) => {
    img.setAttribute("border", "0");
    const declarations = (img.getAttribute("style") ?? "")
      .split(";")
      .map((declaration) => declaration.trim())
      .filter(Boolean);
    const required = [
      ["display", "block"],
      ["border", "0"],
      ["outline", "none"],
      ["text-decoration", "none"],
      ["-ms-interpolation-mode", "bicubic"],
    ] as const;

    required.forEach(([property, value]) => {
      if (!declarations.some((item) => item.startsWith(`${property}:`))) {
        declarations.push(`${property}: ${value}`);
      }
    });

    // Prefer explicit width/height attributes in the style for clients that
    // ignore HTML attributes when CSS is present.
    const width = img.getAttribute("width");
    const height = img.getAttribute("height");
    if (width && !declarations.some((item) => item.startsWith("width:"))) {
      declarations.push(`width: ${width}px`);
    }
    if (height && !declarations.some((item) => item.startsWith("height:"))) {
      declarations.push(`height: ${height}px`);
    }

    img.setAttribute("style", `${declarations.join("; ")};`);
  });

  const table = clone.querySelector("table");
  return (table ?? clone).outerHTML;
}

function isVisuallyEmptyCell(cell: Element): boolean {
  return (
    cell.children.length === 0 &&
    !(cell.textContent ?? "").replace(/\u00a0/g, " ").trim()
  );
}

/** Remove a cell that only hosted a removed field/link, plus its empty row. */
function removeEmptyLayoutCell(cell: Element | null | undefined) {
  if (!cell || cell.tagName !== "TD" || !isVisuallyEmptyCell(cell)) return;
  const row = cell.parentElement;
  cell.remove();
  removeEmptyLayoutRow(row);
}

function removeEmptyLayoutRow(row: Element | null | undefined) {
  if (!row || row.tagName !== "TR") return;
  if ([...row.children].every((child) => isVisuallyEmptyCell(child))) {
    row.remove();
  }
}
