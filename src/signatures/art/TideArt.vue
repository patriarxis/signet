<template>
  <!-- Pixel ocean at sunset: one table per pixel row, runs merged by colour. -->
  <table
    v-for="(row, r) in ROWS"
    :key="`tide-${r}`"
    role="presentation"
    cellspacing="0"
    cellpadding="0"
    border="0"
    width="100%"
    style="border-collapse: collapse; width: 100%; table-layout: fixed"
  >
    <tbody>
      <tr>
        <td
          v-for="(run, i) in row"
          :key="i"
          :width="`${run.width}%`"
          :height="PIXEL"
          :bgcolor="run.color ?? undefined"
          :style="cellStyle(run)"
        >
          &nbsp;
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
/** Grid size; columns stretch with the card, rows are fixed-height pixels. */
const COLS = 64;
const ROW_COUNT = 16;
const PIXEL = 5;
/** Pixel width ÷ height at the 600px max width. */
const ASPECT = 600 / COLS / PIXEL;

const SKY = null;
const SUN_TOP = "#ff8a3d";
const SUN = "#ff5200";
const FOAM = "#f2f0eb";
const CREST = "#bcd2e6";
const SHALLOW = "#5b82a6";
const DEEP = "#24496b";
const ABYSS = "#0e2438";

const SUN_COL = 46;
const SUN_RADIUS = 8.5;
const HORIZON = 10;

interface Run {
  color: string | null;
  width: number;
}

/** Water height (in pixel rows) at column `x`: three stacked sines. */
function surface(x: number): number {
  const t = x / COLS;
  return (
    5 +
    1.9 * Math.sin(t * Math.PI * 4.2 + 0.6) +
    0.9 * Math.sin(t * Math.PI * 9.5 + 2.1) +
    0.4 * Math.sin(t * Math.PI * 21 + 1)
  );
}

function pixel(r: number, c: number): string | null {
  const top = ROW_COUNT - Math.round(surface(c));

  if (r >= top) {
    const depth = r - top;
    // Broken sun reflection: dashes thinning out with depth.
    const reflectHalf = 6 - depth * 0.8;
    if (
      depth >= 1 &&
      Math.abs(c - SUN_COL) <= reflectHalf &&
      (r + c) % 3 !== 0
    ) {
      return SUN;
    }
    if (depth === 0) return (c * 7 + r) % 9 === 0 ? FOAM : CREST;
    if (depth === 1) return SHALLOW;
    if (depth <= 4) return DEEP;
    return ABYSS;
  }

  // Retro sun: pixels are wider than tall, so stretch x to keep it round.
  // The lower half gets horizontal gaps.
  const dx = (c - SUN_COL) * ASPECT;
  const dy = r - HORIZON + 0.5;
  if (Math.hypot(dx, dy) <= SUN_RADIUS) {
    if (r >= HORIZON - 5 && (HORIZON - r) % 2 === 1) return SKY;
    return r < HORIZON - 6 ? SUN_TOP : SUN;
  }
  return SKY;
}

function buildRows(): Run[][] {
  const rows: Run[][] = [];
  for (let r = 0; r < ROW_COUNT; r++) {
    const runs: { color: string | null; span: number }[] = [];
    for (let c = 0; c < COLS; c++) {
      const color = pixel(r, c);
      const last = runs[runs.length - 1];
      if (last && last.color === color) last.span++;
      else runs.push({ color, span: 1 });
    }
    // Round to 4 dp and give the remainder to the last run so rows sum to 100%.
    let used = 0;
    rows.push(
      runs.map((run, i) => {
        const width =
          i === runs.length - 1
            ? Math.round((100 - used) * 1e4) / 1e4
            : Math.round(((run.span * 100) / COLS) * 1e4) / 1e4;
        used += width;
        return { color: run.color, width };
      }),
    );
  }
  return rows;
}

const ROWS = buildRows();

function cellStyle(run: Run) {
  const fill = run.color ? ` background-color: ${run.color};` : "";
  return `width: ${run.width}%; height: ${PIXEL}px; font-size: 0; line-height: 0;${fill}`;
}
</script>
