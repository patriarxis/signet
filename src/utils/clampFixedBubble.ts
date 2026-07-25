/** Keep a fixed toolbar fully inside the viewport; flip above the anchor when needed. */
export function clampFixedBubblePosition(
  anchor: DOMRect,
  bubbleWidth: number,
  bubbleHeight: number,
  gap = 6,
  margin = 8,
): { top: number; left: number } {
  const width = Math.max(bubbleWidth, 1);
  const height = Math.max(bubbleHeight, 1);

  let top = anchor.bottom + gap;
  if (top + height > window.innerHeight - margin) {
    top = anchor.top - height - gap;
  }
  top = Math.max(
    margin,
    Math.min(top, window.innerHeight - height - margin),
  );

  let left = anchor.left;
  left = Math.max(
    margin,
    Math.min(left, window.innerWidth - width - margin),
  );

  return { top, left };
}
