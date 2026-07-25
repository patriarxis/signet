import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = __dirname;
const url = "http://localhost:5174/";

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

async function measure(page) {
  return page.evaluate(() => {
    const aside = document.getElementById("editor-drawer");
    const openBtn = document.querySelector(".editor-open");
    const asideStyle = aside ? getComputedStyle(aside) : null;
    const container = document.querySelector(".signatures-container");
    const signatures = document.querySelector(".signatures");
    const windowEl = document.querySelector(".window");
    const body = document.querySelector(".window-body");
    const table = document.querySelector(".signature-root table");
    const actions = document.querySelector(".app-actions");
    const backdrop = document.querySelector(".drawer-backdrop");

    const containerRect = container?.getBoundingClientRect();
    const signaturesRect = signatures?.getBoundingClientRect();
    const windowRect = windowEl?.getBoundingClientRect();
    const actionsRect = actions?.getBoundingClientRect();
    const tableRect = table?.getBoundingClientRect();
    const bodyRect = body?.getBoundingClientRect();

    const centerDelta = (outer, inner) => {
      if (!outer || !inner) return null;
      const outerMid = (outer.left + outer.right) / 2;
      const innerMid = (inner.left + inner.right) / 2;
      return Math.round((innerMid - outerMid) * 10) / 10;
    };

    const z = (el) => (el ? Number(getComputedStyle(el).zIndex) || 0 : null);

    return {
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      overflowOk: document.documentElement.scrollWidth <= window.innerWidth + 1,
      drawerOpen: aside?.classList.contains("aside--open") ?? false,
      asideTransform: asideStyle?.transform ?? null,
      asidePosition: asideStyle?.position ?? null,
      openBtnDisplay: openBtn ? getComputedStyle(openBtn).display : null,
      openBtnExpanded: openBtn?.getAttribute("aria-expanded") ?? null,
      openBtnLabel: openBtn?.getAttribute("aria-label") ?? null,
      bodyHasDrawerOpen: document.body.classList.contains("drawer-open"),
      zIndex: {
        actions: z(actions),
        backdrop: z(backdrop),
        drawer: z(aside),
        stackOk:
          z(actions) != null &&
          z(backdrop) != null &&
          z(aside) != null &&
          z(actions) < z(backdrop) &&
          z(backdrop) < z(aside),
      },
      containerPaddingTop: container
        ? getComputedStyle(container).paddingTop
        : null,
      cardsCenteredInContainer: centerDelta(containerRect, signaturesRect),
      windowCenteredInContainer: centerDelta(containerRect, windowRect),
      tableCenteredInBody:
        tableRect && bodyRect
          ? Math.abs(centerDelta(bodyRect, tableRect)) < 8 ||
            (body && body.scrollWidth > body.clientWidth + 1)
          : null,
      firstCardClearsActions:
        windowRect && actionsRect
          ? windowRect.top >= actionsRect.bottom - 1
          : null,
      signatureCard: body
        ? {
            clientWidth: body.clientWidth,
            scrollWidth: body.scrollWidth,
            canScrollX: body.scrollWidth > body.clientWidth + 1,
          }
        : null,
      actionBtnChrome: (() => {
        const btn = document.querySelector(".app-actions .action-btn");
        if (!btn) return null;
        const s = getComputedStyle(btn);
        return {
          background: s.backgroundColor,
          borderWidth: s.borderTopWidth,
          borderStyle: s.borderTopStyle,
          boxShadow: s.boxShadow,
        };
      })(),
      drawerCloseRadius: (() => {
        const btn = document.querySelector(".drawer-close");
        if (!btn) return null;
        const s = getComputedStyle(btn);
        return {
          width: s.width,
          height: s.height,
          borderRadius: s.borderRadius,
          display: s.display,
        };
      })(),
    };
  });
}

async function runViewport(label, width, height) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    isMobile: width <= 500,
    hasTouch: width <= 1024,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  const closed = await measure(page);
  await page.screenshot({
    path: path.join(outDir, `${label}-closed.png`),
    fullPage: false,
  });

  await page.click(".editor-open");
  await page.waitForTimeout(400);
  const open = await measure(page);
  const drawerWidth = await page.evaluate(() => {
    const aside = document.getElementById("editor-drawer");
    if (!aside) return null;
    const s = getComputedStyle(aside);
    return {
      width: s.width,
      maxWidth: s.maxWidth,
      clientWidth: aside.clientWidth,
      innerWidth: window.innerWidth,
      isFullWidth: Math.abs(aside.clientWidth - window.innerWidth) <= 1,
    };
  });
  await page.screenshot({
    path: path.join(outDir, `${label}-open.png`),
    fullPage: false,
  });

  // Open button must not close the drawer.
  await page.click(".editor-open", { force: true });
  await page.waitForTimeout(250);
  const stillOpenAfterOpenBtn = await measure(page);

  // On full-width phone drawers the backdrop isn't exposed; use the X.
  if (width > 480) {
    await page.click(".drawer-backdrop", {
      position: { x: Math.max(width - 24, 10), y: Math.floor(height / 2) },
      force: true,
    });
  } else {
    await page.click(".drawer-close");
  }
  await page.waitForTimeout(400);
  const afterBackdrop = await measure(page);

  await page.click(".editor-open");
  await page.waitForTimeout(250);
  await page.click(".drawer-close");
  await page.waitForTimeout(400);
  const afterDrawerClose = await measure(page);

  await page.click(".editor-open");
  await page.waitForTimeout(250);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  const afterEscape = await measure(page);

  results.push({
    label,
    width,
    height,
    closed,
    open,
    drawerWidth,
    stillOpenAfterOpenBtn,
    afterBackdrop,
    afterDrawerClose,
    afterEscape,
  });
  await context.close();
}

async function runDesktop() {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const desktop = await measure(page);
  await page.screenshot({
    path: path.join(outDir, "desktop.png"),
    fullPage: false,
  });

  const layout = await page.evaluate(() => {
    const aside = document.getElementById("editor-drawer");
    const openBtn = document.querySelector(".editor-open");
    const s = getComputedStyle(aside);
    return {
      asidePosition: s.position,
      asideTransform: s.transform,
      asideMaxWidth: s.maxWidth,
      openBtnDisplay: getComputedStyle(openBtn).display,
      containerFlex: getComputedStyle(document.querySelector(".container"))
        .flexDirection,
    };
  });
  results.push({ label: "desktop", desktop, layout });
  await context.close();
}

await runViewport("phone-390", 390, 844);
await runViewport("tablet-768", 768, 1024);
await runDesktop();
await browser.close();

fs.writeFileSync(
  path.join(outDir, "results.json"),
  JSON.stringify(results, null, 2),
);
console.log(JSON.stringify(results, null, 2));
