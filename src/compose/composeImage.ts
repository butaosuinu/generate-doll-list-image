import type { AspectKey, Template } from "../templates/types.ts";
import { resolveLayout } from "../templates/types.ts";
import { coverRect } from "./coverRect.ts";
import { resolveGrid, type Rect } from "./layout.ts";
import { drawText, type Ctx2D } from "./drawText.ts";

export interface LoadedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
}

export interface DollImage extends LoadedImage {
  name: string;
  /** クロップ中心 0..1（未指定は中央）。 */
  focusX?: number;
  focusY?: number;
}

export interface CompositionInput {
  template: Template;
  aspect: AspectKey;
  dolls: DollImage[];
  title?: string;
  /** 読み込み済み背景画像（無ければ backgroundColor で塗りつぶし）。 */
  background: LoadedImage | null;
}

export type OutputFormat = "png" | "jpeg";

/** 出力解像度のフルサイズ canvas に合成を描画し、Blob を返す。 */
export async function composeToBlob(
  input: CompositionInput,
  format: OutputFormat,
  quality = 0.92,
): Promise<Blob> {
  const variant = input.template.variants[input.aspect];
  const canvas = createCanvas(variant.width, variant.height);
  drawComposition(get2d(canvas), input);
  return canvasToBlob(canvas, format, quality);
}

/**
 * 合成の中核（同期）。出力ピクセル座標 (variant.width×height) で描画する。
 * プレビューは呼び出し側が ctx に拡大変換を掛けて同じ関数を使う。
 */
export function drawComposition(ctx: Ctx2D, input: CompositionInput): void {
  const { template, aspect, dolls, background } = input;
  const variant = template.variants[aspect];
  const W = variant.width;
  const H = variant.height;

  // 1. 背景
  ctx.save();
  ctx.fillStyle = template.backgroundColor;
  ctx.fillRect(0, 0, W, H);
  if (background) {
    const c = coverRect(background.width, background.height, W, H);
    ctx.drawImage(background.source, c.sx, c.sy, c.cw, c.ch, 0, 0, W, H);
  }
  ctx.restore();

  // 2. タイトル
  if (template.title) {
    const text = input.title ?? template.title.defaultText ?? "";
    drawText(ctx, text, normToPx(template.title.rect, W, H), template.title.style, H);
  }

  // 3. 写真グリッド + 名前
  const layout = resolveLayout(template, aspect);
  const grid = resolveGrid(W, H, layout, dolls.length);

  grid.cells.forEach((cell, i) => {
    const doll = dolls[i];
    if (!doll) return;
    const r = (template.cellCornerRatio ?? 0) * cell.image.w;

    // 写真（角丸クリップ + cover クロップ）
    ctx.save();
    roundRectPath(ctx, cell.image, r);
    ctx.clip();
    const crop = coverRect(
      doll.width,
      doll.height,
      cell.image.w,
      cell.image.h,
      doll.focusX,
      doll.focusY,
    );
    ctx.drawImage(
      doll.source,
      crop.sx,
      crop.sy,
      crop.cw,
      crop.ch,
      cell.image.x,
      cell.image.y,
      cell.image.w,
      cell.image.h,
    );
    ctx.restore();

    // 枠線
    if (template.cellBorderColor) {
      ctx.save();
      roundRectPath(ctx, cell.image, r);
      ctx.lineWidth = Math.max(1, cell.image.w * 0.012);
      ctx.strokeStyle = template.cellBorderColor;
      ctx.stroke();
      ctx.restore();
    }

    // 名前
    drawText(ctx, doll.name, cell.label, template.defaultTextStyle, H);
  });
}

function normToPx(
  rect: { x: number; y: number; w: number; h: number },
  W: number,
  H: number,
): Rect {
  return { x: rect.x * W, y: rect.y * H, w: rect.w * W, h: rect.h * H };
}

/** roundRect 非対応環境でも動くよう arcTo でパスを引く。 */
function roundRectPath(ctx: Ctx2D, rect: Rect, radius: number): void {
  const r = Math.max(0, Math.min(radius, rect.w / 2, rect.h / 2));
  const { x, y, w, h } = rect;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;

function createCanvas(w: number, h: number): AnyCanvas {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function get2d(canvas: AnyCanvas): Ctx2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D コンテキストを取得できませんでした");
  return ctx as Ctx2D;
}

async function canvasToBlob(
  canvas: AnyCanvas,
  format: OutputFormat,
  quality: number,
): Promise<Blob> {
  const type = format === "png" ? "image/png" : "image/jpeg";
  if ("convertToBlob" in canvas) {
    return canvas.convertToBlob({ type, quality });
  }
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("画像の書き出しに失敗しました"))),
      type,
      quality,
    );
  });
}
