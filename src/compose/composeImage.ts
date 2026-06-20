import type { AspectKey, Template, TextStyle } from "../templates/types.ts";
import { resolveLayout } from "../templates/types.ts";
import { coverRect } from "./coverRect.ts";
import { resolveGrid, type LabelAnchor, type Rect } from "./layout.ts";
import { drawLabel, type Ctx2D } from "./drawText.ts";

export type { LabelAnchor };

export interface LoadedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
}

export interface DollImage extends LoadedImage {
  name: string;
  /** 補足テキスト（改行可）。 */
  note?: string;
  /** クロップ中心 0..1（未指定は中央）。 */
  focusX?: number;
  focusY?: number;
}

/** 名前ラベルの見せ方。box=半透明帯の上に文字 / outline=縁取り文字のみ。 */
export type LabelStyle = "box" | "outline";

export interface CompositionInput {
  template: Template;
  aspect: AspectKey;
  dolls: DollImage[];
  /** 名前ラベルの見せ方（ユーザー設定）。 */
  labelStyle: LabelStyle;
  /** 名前ラベルを写真の上／下どちらに被せるか（ユーザー設定）。 */
  labelAnchor: LabelAnchor;
  /** 読み込み済み背景画像（無ければ backgroundColor で塗りつぶし）。 */
  background: LoadedImage | null;
}

/** #rrggbb / #rgb の知覚輝度（0..1）。判定不能なら明るい寄りに倒す。 */
function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 1;
  const h = m[1].length === 3 ? m[1].replace(/(.)/g, "$1$1") : m[1];
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** 背景ボックス色が未指定のときのフォールバック（背景色の輝度で明＝白／暗＝黒の半透明）。 */
function fallbackBoxColor(template: Template): string {
  return luminance(template.backgroundColor) < 0.4
    ? "rgba(10,12,24,0.5)"
    : "rgba(255,255,255,0.66)";
}

/** 補足の従スタイル。テンプレに無ければ名前スタイルから小さめに導出。 */
function resolveSubStyle(template: Template): TextStyle {
  return (
    template.subTextStyle ?? {
      ...template.defaultTextStyle,
      fontSizeRatio: template.defaultTextStyle.fontSizeRatio * 0.7,
      maxLines: 4,
    }
  );
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
  const { template, aspect, dolls, background, labelStyle, labelAnchor } = input;
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

  // 2. 写真グリッド + 名前（写真に被せる）
  const layout = resolveLayout(template, aspect);
  const grid = resolveGrid(W, H, layout, dolls.length, labelAnchor);
  const subStyle = resolveSubStyle(template);
  const boxColor = template.labelBoxColor ?? fallbackBoxColor(template);

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

    // 名前 + 補足（写真の角丸内にクリップして帯／文字を被せる）
    const note = doll.note ?? "";
    if (doll.name.trim() || note.trim()) {
      ctx.save();
      roundRectPath(ctx, cell.image, r);
      ctx.clip();
      if (labelStyle === "box") {
        ctx.fillStyle = boxColor;
        ctx.fillRect(cell.label.x, cell.label.y, cell.label.w, cell.label.h);
      }
      drawLabel(ctx, { name: doll.name, note }, cell.label, template.defaultTextStyle, subStyle, H);
      ctx.restore();
    }
  });
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
