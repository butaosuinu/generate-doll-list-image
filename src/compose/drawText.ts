import type { TextStyle } from "../templates/types.ts";
import type { Rect } from "./layout.ts";

export type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

const LINE_HEIGHT_FACTOR = 1.18;
/** 名前と補足の間隔（補足フォントサイズに対する比率）。 */
const NAME_NOTE_GAP_FACTOR = 0.25;

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

function alignX(rect: Rect, align: TextStyle["align"]): number {
  if (align === "left") return rect.x;
  if (align === "right") return rect.x + rect.w;
  return rect.x + rect.w / 2;
}

/** 縁取り → 塗りの順で 1 行を描く。ctx.font / textBaseline / textAlign は呼び出し側で設定済み。 */
function drawStyledLine(
  ctx: Ctx2D,
  line: string,
  x: number,
  y: number,
  fontSizePx: number,
  style: TextStyle,
): void {
  const strokeWidth = (style.strokeRatio ?? 0) * fontSizePx;
  if (style.strokeColor && strokeWidth > 0) {
    ctx.lineJoin = "round";
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = style.strokeColor;
    ctx.strokeText(line, x, y);
  }
  ctx.fillStyle = style.color;
  ctx.fillText(line, x, y);
}

export interface LabelContent {
  name: string;
  note: string;
}

/**
 * 名前（主）＋補足（従・改行可）を 1 つの帯 (rect) に縦積みで描画する。
 * それぞれ wrapText で折り返し、合計ブロック高が rect.h を超える場合は両者を同率で
 * 縮小して収める。rect 内で縦中央寄せし、各スタイルの整列・縁取りで描く。
 */
export function drawLabel(
  ctx: Ctx2D,
  content: LabelContent,
  rect: Rect,
  primary: TextStyle,
  secondary: TextStyle,
  canvasH: number,
): void {
  const name = content.name.trim();
  const note = content.note.trim();
  if (!name && !note) return;

  let fontP = Math.max(1, primary.fontSizeRatio * canvasH);
  let fontS = Math.max(1, secondary.fontSizeRatio * canvasH);

  ctx.save();

  const wrapAt = () => {
    ctx.font = `${fontP}px ${primary.fontFamily}`;
    nameLines = name ? wrapText(ctx, name, rect.w, primary.maxLines) : [];
    ctx.font = `${fontS}px ${secondary.fontFamily}`;
    noteLines = note ? wrapText(ctx, note, rect.w, secondary.maxLines) : [];
  };
  let nameLines: string[] = [];
  let noteLines: string[] = [];
  wrapAt();

  const measureTotal = (fp: number, fs: number, g: number) =>
    nameLines.length * fp * LINE_HEIGHT_FACTOR + g + noteLines.length * fs * LINE_HEIGHT_FACTOR;

  let gap = nameLines.length && noteLines.length ? fontS * NAME_NOTE_GAP_FACTOR : 0;
  let total = measureTotal(fontP, fontS, gap);

  // 帯に収まらない場合は主従とも同率で縮小。縮小後も 1px を下限に保ち、極端な過密でも
  // 0px 化しないようにする。縮小後のフォントで折り返し直し、大きいフォント基準の
  // 不要な … 省略（実サイズなら収まる行が切られる）を避ける。
  if (total > rect.h) {
    const s = rect.h / total;
    fontP = Math.max(1, fontP * s);
    fontS = Math.max(1, fontS * s);
    gap *= s;
    wrapAt();
    total = measureTotal(fontP, fontS, gap);
  }

  // 各行を行ボックスの中央に描く（middle 基準）。ブロックを rect 内で縦中央寄せ。
  ctx.textBaseline = "middle";
  let y = rect.y + (rect.h - total) / 2;

  const lineHeightP = fontP * LINE_HEIGHT_FACTOR;
  ctx.font = `${fontP}px ${primary.fontFamily}`;
  ctx.textAlign = primary.align;
  const xP = alignX(rect, primary.align);
  for (const line of nameLines) {
    drawStyledLine(ctx, line, xP, y + lineHeightP / 2, fontP, primary);
    y += lineHeightP;
  }

  y += gap;

  const lineHeightS = fontS * LINE_HEIGHT_FACTOR;
  ctx.font = `${fontS}px ${secondary.fontFamily}`;
  ctx.textAlign = secondary.align;
  const xS = alignX(rect, secondary.align);
  for (const line of noteLines) {
    drawStyledLine(ctx, line, xS, y + lineHeightS / 2, fontS, secondary);
    y += lineHeightS;
  }

  ctx.restore();
}
