import { describe, it, expect } from "vitest";
import { wrapText, drawLabel, type Ctx2D } from "./drawText.ts";
import type { TextStyle } from "../templates/types.ts";

/**
 * 決定的なモック 2D コンテキスト。`font` の "<px>px" を読んで 1 文字 = px*0.6 幅で measureText を返す。
 * fillText / strokeText の呼び出しを記録する（jsdom の canvas メトリクスに依存しないため）。
 */
function mockCtx(): Ctx2D & { fills: { text: string; x: number; y: number; px: number }[] } {
  const ctx: any = {
    font: "10px sans-serif",
    textBaseline: "alphabetic",
    textAlign: "left",
    fillStyle: "#000",
    strokeStyle: "#000",
    lineWidth: 0,
    lineJoin: "miter",
    fills: [],
    _px() {
      const m = /^([0-9.]+)px/.exec(this.font);
      return m ? parseFloat(m[1]) : 10;
    },
    measureText(s: string) {
      return { width: Array.from(s).length * this._px() * 0.6 };
    },
    fillText(text: string, x: number, y: number) {
      this.fills.push({ text, x, y, px: this._px() });
    },
    strokeText() {},
    save() {},
    restore() {},
  };
  return ctx;
}

const style = (over: Partial<TextStyle> = {}): TextStyle => ({
  fontFamily: "sans-serif",
  fontSizeRatio: 0.04,
  color: "#111",
  align: "center",
  maxLines: 2,
  ...over,
});

describe("wrapText", () => {
  it("maxWidth で折り返し、maxLines を超えない", () => {
    const ctx = mockCtx();
    ctx.font = "10px sans-serif"; // 1 文字 = 6px
    const lines = wrapText(ctx, "あいうえおかきくけこ", 30, 2); // 5 文字/行
    expect(lines).toHaveLength(2);
    expect(Array.from(lines[0])).toHaveLength(5);
  });

  it("収まらない場合は末尾を … で省略", () => {
    const ctx = mockCtx();
    ctx.font = "10px sans-serif";
    const lines = wrapText(ctx, "あいうえおかきくけこさしすせそ", 30, 2);
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith("…")).toBe(true);
  });

  it("改行 \\n で強制的に折り返す", () => {
    const ctx = mockCtx();
    ctx.font = "10px sans-serif";
    const lines = wrapText(ctx, "あ\nい", 300, 3);
    expect(lines).toEqual(["あ", "い"]);
  });
});

describe("drawLabel", () => {
  it("名前も補足も空なら何も描かない", () => {
    const ctx = mockCtx();
    drawLabel(
      ctx,
      { name: "  ", note: "" },
      { x: 0, y: 0, w: 200, h: 100 },
      style(),
      style(),
      1000,
    );
    expect(ctx.fills).toHaveLength(0);
  });

  it("名前のみ描画し、フォントは primary.fontSizeRatio*canvasH", () => {
    const ctx = mockCtx();
    drawLabel(
      ctx,
      { name: "アリス", note: "" },
      { x: 0, y: 0, w: 400, h: 500 },
      style(),
      style({ fontSizeRatio: 0.02 }),
      1000,
    );
    expect(ctx.fills.length).toBeGreaterThan(0);
    expect(ctx.fills.some((f) => f.text === "アリス")).toBe(true);
    expect(ctx.fills[0].px).toBeCloseTo(40); // 0.04 * 1000
  });

  it("名前＋補足を両方描画し、補足は名前より小さいフォント", () => {
    const ctx = mockCtx();
    drawLabel(
      ctx,
      { name: "アリス", note: "DDH-06" },
      { x: 0, y: 0, w: 400, h: 500 },
      style({ fontSizeRatio: 0.04 }),
      style({ fontSizeRatio: 0.02, maxLines: 4 }),
      1000,
    );
    const namePx = ctx.fills.find((f) => f.text === "アリス")?.px ?? 0;
    const notePx = ctx.fills.find((f) => f.text === "DDH-06")?.px ?? 0;
    expect(namePx).toBeGreaterThan(0);
    expect(notePx).toBeGreaterThan(0);
    expect(notePx).toBeLessThan(namePx);
  });

  it("帯が極端に狭くてもフォントは 1px を下回らない（floor）", () => {
    const ctx = mockCtx();
    drawLabel(
      ctx,
      { name: "アリス", note: "DDH-06\n作家\n誕生日\n一言" },
      { x: 0, y: 0, w: 100, h: 4 }, // ほぼ潰れた帯
      style({ fontSizeRatio: 0.04 }),
      style({ fontSizeRatio: 0.02, maxLines: 4 }),
      1000,
    );
    expect(ctx.fills.length).toBeGreaterThan(0);
    for (const f of ctx.fills) expect(f.px).toBeGreaterThanOrEqual(1);
  });
});
