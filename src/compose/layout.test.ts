import { describe, it, expect } from "vitest";
import { resolveGrid, autoColumns } from "./layout.ts";
import type { GridLayout } from "../templates/types.ts";

const base: GridLayout = {
  area: { x: 0, y: 0, w: 1, h: 1 },
  columns: 0,
  gap: 0,
  cellAspect: 1,
  labelHeight: 0.2,
};

describe("resolveGrid", () => {
  it("枚数0なら空", () => {
    const g = resolveGrid(1000, 1000, base, 0);
    expect(g).toEqual({ columns: 0, rows: 0, cells: [] });
  });

  it("正方形キャンバス・4枚は2列に自動配置される", () => {
    const g = resolveGrid(1000, 1000, base, 4);
    expect(g.columns).toBe(2);
    expect(g.rows).toBe(2);
    expect(g.cells).toHaveLength(4);
  });

  it("固定列数で最後の行が中央寄せされる", () => {
    const g = resolveGrid(1000, 1000, { ...base, columns: 3 }, 5);
    expect(g.columns).toBe(3);
    expect(g.rows).toBe(2);
    // 1行目3枚: 幅いっぱい
    expect(g.cells[0].image.x).toBeCloseTo(0);
    expect(g.cells[0].image.w).toBeCloseTo(1000 / 3);
    // 2行目2枚: 中央寄せ → 左端がずれる
    expect(g.cells[3].image.x).toBeCloseTo((1000 - (2 * 1000) / 3) / 2);
    expect(g.cells[4].image.x).toBeGreaterThan(g.cells[3].image.x);
  });

  it("ラベル帯は写真の下端に被さり・同じ幅（既定 bottom）", () => {
    const g = resolveGrid(1000, 1000, { ...base, columns: 2 }, 2);
    const c = g.cells[0];
    expect(c.label.x).toBeCloseTo(c.image.x);
    expect(c.label.w).toBeCloseTo(c.image.w);
    expect(c.label.h).toBeCloseTo(c.image.h * base.labelHeight);
    // 帯は写真の内側下端に重なる（写真の下には突き出さない）
    expect(c.label.y).toBeCloseTo(c.image.y + c.image.h - c.label.h);
    expect(c.label.y + c.label.h).toBeCloseTo(c.image.y + c.image.h);
  });

  it("labelAnchor:top で帯が写真の上端に被さる", () => {
    const g = resolveGrid(1000, 1000, { ...base, columns: 2 }, 2, "top");
    const c = g.cells[0];
    expect(c.label.y).toBeCloseTo(c.image.y);
    expect(c.label.h).toBeCloseTo(c.image.h * base.labelHeight);
  });

  it("全セル（写真＝帯とも）がグリッド領域内に収まる", () => {
    const g = resolveGrid(1600, 900, { ...base, area: { x: 0.05, y: 0.1, w: 0.9, h: 0.8 } }, 7);
    const ax = 0.05 * 1600;
    const ay = 0.1 * 900;
    const aw = 0.9 * 1600;
    const ah = 0.8 * 900;
    for (const cell of g.cells) {
      expect(cell.image.x).toBeGreaterThanOrEqual(ax - 0.5);
      expect(cell.image.x + cell.image.w).toBeLessThanOrEqual(ax + aw + 0.5);
      expect(cell.image.y).toBeGreaterThanOrEqual(ay - 0.5);
      // 帯は写真内なので写真下端で領域内に収まることを確認
      expect(cell.image.y + cell.image.h).toBeLessThanOrEqual(ay + ah + 0.5);
    }
  });
});

describe("autoColumns", () => {
  it("横長領域は縦長領域より列数が多くなる", () => {
    const wide = autoColumns(1600, 900, 0, 1, 0.2, 6);
    const tall = autoColumns(900, 1600, 0, 1, 0.2, 6);
    expect(wide).toBeGreaterThanOrEqual(tall);
    expect(wide).toBe(3);
    expect(tall).toBe(2);
  });

  it("1枚なら1列", () => {
    expect(autoColumns(1000, 1000, 0, 1, 0.2, 1)).toBe(1);
  });
});
