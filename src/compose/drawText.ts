import type { TextStyle } from "../templates/types.ts";
import type { Rect } from "./layout.ts";

export type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

const LINE_HEIGHT_FACTOR = 1.18;

/**
 * 矩形 (maxWidth) に収まるよう text を折り返す。日本語は文字単位、半角スペースでも
 * 改行できる素朴な貪欲法。maxLines を超える場合は末尾を ellipsis で省略する。
 */
export function wrapText(
  ctx: Ctx2D,
  text: string,
  maxWidth: number,
  maxLines: number,
  ellipsis = "…",
): string[] {
  if (maxLines <= 0 || maxWidth <= 0) return [];
  const chars = Array.from(text.replace(/\r/g, ""));
  const lines: string[] = [];
  let line = "";
  let consumed = 0;

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === "\n") {
      lines.push(line);
      line = "";
      consumed = i + 1;
      if (lines.length === maxLines) break;
      continue;
    }
    if (line === "" || ctx.measureText(line + ch).width <= maxWidth) {
      line += ch;
      consumed = i + 1;
    } else {
      lines.push(line);
      line = ch;
      consumed = i; // ch はまだ描画行に確定していない
      if (lines.length === maxLines) break;
      consumed = i + 1;
    }
  }

  if (lines.length < maxLines && (line !== "" || lines.length === 0)) {
    lines.push(line);
    consumed = chars.length;
  }

  if (consumed < chars.length && lines.length > 0) {
    // 末尾行を省略記号付きに詰める
    let last = lines[lines.length - 1];
    while (last.length > 0 && ctx.measureText(last + ellipsis).width > maxWidth) {
      last = Array.from(last).slice(0, -1).join("");
    }
    lines[lines.length - 1] = last + ellipsis;
  }

  return lines;
}

/**
 * 矩形内に折り返し・縁取り・整列を適用してテキストを描画する。
 * フォントサイズは「キャンバス高さ比率」と「行数が帯に収まる上限」の小さい方。
 */
export function drawText(
  ctx: Ctx2D,
  text: string,
  rect: Rect,
  style: TextStyle,
  canvasH: number,
): void {
  const trimmed = text.trim();
  if (!trimmed) return;

  const maxByBand = rect.h / (style.maxLines * LINE_HEIGHT_FACTOR);
  const fontSizePx = Math.max(1, Math.min(style.fontSizeRatio * canvasH, maxByBand));
  const lineHeight = fontSizePx * LINE_HEIGHT_FACTOR;

  ctx.save();
  ctx.font = `${fontSizePx}px ${style.fontFamily}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = style.align;

  const lines = wrapText(ctx, trimmed, rect.w, style.maxLines);
  const blockH = lines.length * lineHeight;
  let y = rect.y + (rect.h - blockH) / 2 + lineHeight / 2;

  const x =
    style.align === "left"
      ? rect.x
      : style.align === "right"
        ? rect.x + rect.w
        : rect.x + rect.w / 2;

  const strokeWidth = (style.strokeRatio ?? 0) * fontSizePx;
  for (const line of lines) {
    if (style.strokeColor && strokeWidth > 0) {
      ctx.lineJoin = "round";
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = style.strokeColor;
      ctx.strokeText(line, x, y);
    }
    ctx.fillStyle = style.color;
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
  ctx.restore();
}
