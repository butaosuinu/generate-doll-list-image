import { describe, it, expect } from "vitest";
import { coverRect } from "./coverRect.ts";

describe("coverRect", () => {
  it("正方形→正方形は全面を使う", () => {
    const c = coverRect(100, 100, 50, 50);
    expect(c).toEqual({ sx: 0, sy: 0, cw: 100, ch: 100 });
  });

  it("横長ソースを正方形枠に入れると左右が切られる（中央）", () => {
    const c = coverRect(200, 100, 100, 100);
    // scale = max(100/200, 100/100) = 1 → cw=100, ch=100, 横に100余る→中央で50切る
    expect(c.cw).toBeCloseTo(100);
    expect(c.ch).toBeCloseTo(100);
    expect(c.sx).toBeCloseTo(50);
    expect(c.sy).toBeCloseTo(0);
  });

  it("縦長ソースを正方形枠に入れると上下が切られる（中央）", () => {
    const c = coverRect(100, 200, 100, 100);
    expect(c.cw).toBeCloseTo(100);
    expect(c.ch).toBeCloseTo(100);
    expect(c.sx).toBeCloseTo(0);
    expect(c.sy).toBeCloseTo(50);
  });

  it("focus で切り出し位置が寄る", () => {
    const top = coverRect(100, 200, 100, 100, 0.5, 0);
    expect(top.sy).toBeCloseTo(0);
    const bottom = coverRect(100, 200, 100, 100, 0.5, 1);
    expect(bottom.sy).toBeCloseTo(100);
  });

  it("focus は 0..1 にクランプされる", () => {
    const c = coverRect(100, 200, 100, 100, 0.5, 5);
    expect(c.sy).toBeCloseTo(100);
  });

  it("ゼロ・負のサイズでも例外を投げない", () => {
    expect(() => coverRect(0, 0, 100, 100)).not.toThrow();
    expect(() => coverRect(100, 100, 0, 0)).not.toThrow();
  });
});
