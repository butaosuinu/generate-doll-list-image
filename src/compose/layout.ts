import type { GridLayout } from "../templates/types.ts";

/** 名前ラベルを写真のどちら側に被せるか（ユーザー設定）。 */
export type LabelAnchor = "top" | "bottom";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LayoutCell {
  /** 写真を描画する矩形（px）。 */
  image: Rect;
  /** 名前ラベルを描画する矩形（px）。 */
  label: Rect;
}

export interface GridResult {
  columns: number;
  rows: number;
  cells: LayoutCell[];
}

/**
 * 指定の列数で、グリッド領域に収まるセル（写真）の幅を返す。
 * 幅基準で割り付けた高さが領域からはみ出す場合は高さ基準に切り替える。
 */
function cellWidthFor(
  areaW: number,
  areaH: number,
  gapPx: number,
  cellAspect: number,
  labelHeight: number,
  count: number,
  columns: number,
): number {
  const rows = Math.ceil(count / columns);
  const availW = areaW - (columns - 1) * gapPx;
  const availH = areaH - (rows - 1) * gapPx;
  if (availW <= 0 || availH <= 0) return 0;

  const cellWByWidth = availW / columns;
  const cellTotalHByWidth = (cellWByWidth / cellAspect) * (1 + labelHeight);
  if (rows * cellTotalHByWidth <= availH) {
    return cellWByWidth;
  }
  // 高さが制約 → 高さ基準で写真幅を逆算
  const cellTotalH = availH / rows;
  const imageH = cellTotalH / (1 + labelHeight);
  return imageH * cellAspect;
}

/**
 * ドール枚数とグリッド領域の形状から、写真が最も大きくなる列数を選ぶ。
 * 横長の領域では列が増え、縦長では列が減る方向に自然に収束する。
 */
export function autoColumns(
  areaW: number,
  areaH: number,
  gapPx: number,
  cellAspect: number,
  labelHeight: number,
  count: number,
): number {
  if (count <= 1) return 1;
  let best = 1;
  let bestW = -1;
  for (let c = 1; c <= count; c++) {
    const w = cellWidthFor(areaW, areaH, gapPx, cellAspect, labelHeight, count, c);
    if (w > bestW + 1e-6) {
      bestW = w;
      best = c;
    }
  }
  return best;
}

/**
 * キャンバス (W×H) 上に、写真＋ラベルのグリッドを配置する。
 * 写真はセル全体を占め、名前ラベルは写真の上端／下端に被せる帯として配置する。
 * 各セルは領域内で中央寄せされ、最後の行に欠けがある場合はその行も中央寄せする。
 */
export function resolveGrid(
  canvasW: number,
  canvasH: number,
  layout: GridLayout,
  count: number,
  labelAnchor: LabelAnchor = "bottom",
): GridResult {
  if (count <= 0) return { columns: 0, rows: 0, cells: [] };

  const area: Rect = {
    x: layout.area.x * canvasW,
    y: layout.area.y * canvasH,
    w: layout.area.w * canvasW,
    h: layout.area.h * canvasH,
  };
  const gapPx = layout.gap * area.w;

  // ラベルは写真に被せる（帯ぶんの高さを別に確保しない）ため、サイズ計算は labelHeight=0。
  const columns =
    layout.columns > 0
      ? Math.min(layout.columns, count)
      : autoColumns(area.w, area.h, gapPx, layout.cellAspect, 0, count);
  const rows = Math.ceil(count / columns);

  const cellW = cellWidthFor(area.w, area.h, gapPx, layout.cellAspect, 0, count, columns);
  const imageH = cellW / layout.cellAspect;
  const labelBandH = imageH * layout.labelHeight;
  const cellTotalH = imageH;
  const anchorTop = labelAnchor === "top";

  const gridH = rows * cellTotalH + (rows - 1) * gapPx;
  const gridStartY = area.y + (area.h - gridH) / 2;

  const cells: LayoutCell[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / columns);
    const colInRow = i % columns;
    const itemsInRow = Math.min(columns, count - row * columns);
    const rowW = itemsInRow * cellW + (itemsInRow - 1) * gapPx;
    const rowStartX = area.x + (area.w - rowW) / 2;

    const x = rowStartX + colInRow * (cellW + gapPx);
    const y = gridStartY + row * (cellTotalH + gapPx);

    cells.push({
      image: { x, y, w: cellW, h: imageH },
      label: { x, y: anchorTop ? y : y + imageH - labelBandH, w: cellW, h: labelBandH },
    });
  }

  return { columns, rows, cells };
}
