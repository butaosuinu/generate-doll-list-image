import { describe, it, expect } from "vitest";
import { coverRect } from "../compose/coverRect.ts";
import {
  analyzeFocus,
  columnDetail,
  cropFrameRect,
  detailHeadTop,
  focusFromBbox,
  locateSubject,
  luma,
  rowDetail,
  smooth1d,
  weightedCentroid,
} from "./autoFocus.ts";

/** w×h の RGBA を、(y) → グレー輝度 を返す関数から作る。 */
function grayImage(w: number, h: number, lumaAt: (x: number, y: number) => number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const v = lumaAt(x, y);
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  return data;
}

describe("luma", () => {
  it("白は ~255、黒は 0、純赤は BT.601 係数(0.299)で ~76", () => {
    const data = new Uint8ClampedArray([
      255, 255, 255, 255, // 白
      0, 0, 0, 255, // 黒
      255, 0, 0, 255, // 赤
    ]);
    const L = luma(data, 3, 1);
    expect(L[0]).toBeCloseTo(255);
    expect(L[1]).toBeCloseTo(0);
    expect(L[2]).toBeCloseTo(76.245);
  });
});

describe("smooth1d", () => {
  it("移動平均でスパイクが鈍る／半径0は変更なし", () => {
    const a = new Float32Array([0, 0, 9, 0, 0]);
    const s = smooth1d(a, 1);
    expect(s[2]).toBeCloseTo(3); // (0+9+0)/3
    expect(s[0]).toBeCloseTo(0); // (0+0)/2 端
    expect(Array.from(smooth1d(a, 0))).toEqual([0, 0, 9, 0, 0]);
  });
});

describe("rowDetail", () => {
  it("輝度が水平に切り替わる行でエッジ密度が立つ", () => {
    // 上 2 行=0、下 2 行=200 の横エッジ（境界は row2）
    const w = 4;
    const h = 4;
    const lum = new Float32Array(w * h);
    for (let y = 2; y < h; y++) for (let x = 0; x < w; x++) lum[y * w + x] = 200;
    const d = rowDetail(lum, w, h);
    expect(d[2]).toBeCloseTo(200); // row2 が row1 と 200 違う
    expect(d[3]).toBeCloseTo(0);
    expect(d[0]).toBeCloseTo(d[1]); // 先頭行は次行で代用
  });
});

describe("columnDetail", () => {
  it("輝度が縦に切り替わる列でエッジ密度が立つ", () => {
    const w = 4;
    const h = 4;
    const lum = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 2; x < w; x++) lum[y * w + x] = 200;
    const d = columnDetail(lum, w, h);
    expect(d[2]).toBeCloseTo(200);
    expect(d[3]).toBeCloseTo(0);
  });
});

describe("detailHeadTop", () => {
  it("低→継続的に高い領域の上端を返す", () => {
    // index5 から 10 が続く（sustain=4 を満たす最初の行 = 5）
    const det = new Float32Array([0, 0, 0, 0, 0, 10, 10, 10, 10, 0, 0]);
    expect(detailHeadTop(det)).toBe(5);
  });

  it("単発スパイクは sustain 未満なので拾わない", () => {
    const det = new Float32Array([0, 0, 0, 10, 0, 0, 0, 0, 0, 0]);
    expect(detailHeadTop(det)).toBe(-1);
  });

  it("完全に平坦なら -1（ディテール無し）", () => {
    expect(detailHeadTop(new Float32Array([5, 5, 5, 5, 5, 5]))).toBe(-1);
  });

  it("配列が短すぎる場合は -1", () => {
    expect(detailHeadTop(new Float32Array([9, 9, 9]))).toBe(-1);
  });
});

describe("weightedCentroid", () => {
  it("重みが一点に集中すればその位置／総和0なら中央", () => {
    expect(weightedCentroid(new Float32Array([0, 0, 10, 0, 0]))).toBeCloseTo(2);
    expect(weightedCentroid(new Float32Array([0, 0, 0, 0, 0]))).toBeCloseTo(2); // (5-1)/2
  });
});

describe("locateSubject", () => {
  it("上部が無地・中央から下にディテールがある画像で頭上端を検出する", () => {
    const w = 40;
    const h = 60;
    // y<20 は一様(=80) の無地背景。y>=20 はチェッカー模様（強いエッジ）。
    const data = grayImage(w, h, (x, y) => {
      if (y < 20) return 80;
      return (x + y) % 2 === 0 ? 20 : 220;
    });
    const box = locateSubject(data, w, h);
    expect(box).not.toBeNull();
    // 平滑化と sustain の都合で多少前後するが、無地→模様の境界(20)付近
    expect(box!.y).toBeGreaterThanOrEqual(18);
    expect(box!.y).toBeLessThanOrEqual(22);
  });

  it("完全に一様な画像（ディテール皆無）では null", () => {
    const data = grayImage(20, 30, () => 128);
    expect(locateSubject(data, 20, 30)).toBeNull();
  });
});

describe("focusFromBbox", () => {
  it("縦長: 頭の上端基準で focusY を逆算し coverRect と往復一致する", () => {
    const srcW = 1000;
    const srcH = 2000;
    const { focusX, focusY } = focusFromBbox({ x: 500, y: 200, w: 0, h: 0 }, srcW, srcH);
    // syWanted = 200 - 0.06*1000 = 140 → focusY = 140/1000 = 0.14
    expect(focusY).toBeCloseTo(0.14);
    const crop = coverRect(srcW, srcH, 100, 100, focusX, focusY);
    expect(crop.sy).toBeCloseTo(140);
  });

  it("頭が上端なら focusY は 0 にクランプ", () => {
    const r = focusFromBbox({ x: 500, y: 0, w: 0, h: 0 }, 1000, 2000);
    expect(r.focusY).toBeCloseTo(0);
  });

  it("頭が下寄りでも maxFocusY(0.35) を超えない（頭切れ防止）", () => {
    const r = focusFromBbox({ x: 500, y: 800, w: 0, h: 0 }, 1000, 2000);
    expect(r.focusY).toBeCloseTo(0.35);
  });

  it("横長: focusX が被写体の水平中心に寄る／ゼロ割しない", () => {
    const r = focusFromBbox({ x: 600, y: 0, w: 0, h: 0 }, 2000, 1000);
    // center = 600 → sxWanted = 600-500 = 100 → focusX = 100/1000 = 0.1
    expect(r.focusX).toBeCloseTo(0.1);
    expect(r.focusY).toBeCloseTo(0.5);
  });

  it("正方形ソースは中央（ゼロ割回避）", () => {
    const r = focusFromBbox({ x: 350, y: 100, w: 0, h: 0 }, 1000, 1000);
    expect(r.focusX).toBeCloseTo(0.5);
    expect(r.focusY).toBeCloseTo(0.5);
  });
});

describe("cropFrameRect", () => {
  it("等倍表示では coverRect の切り出し矩形と一致する", () => {
    const f = cropFrameRect(100, 200, 100, 200, 0.5, 0.25);
    expect(f).toEqual({ x: 0, y: 25, w: 100, h: 100 });
    const cr = coverRect(100, 200, 100, 100, 0.5, 0.25);
    expect(f.x).toBeCloseTo(cr.sx);
    expect(f.y).toBeCloseTo(cr.sy);
    expect(f.w).toBeCloseTo(cr.cw);
    expect(f.h).toBeCloseTo(cr.ch);
  });

  it("縮小表示では枠も同じ比率で縮む", () => {
    const half = cropFrameRect(50, 100, 100, 200, 0.5, 0.25);
    expect(half).toEqual({ x: 0, y: 12.5, w: 50, h: 50 });
  });

  it("0 サイズのソースでも NaN にならず表示全体を枠にする", () => {
    const f = cropFrameRect(96, 96, 0, 0, 0.5, 0.5);
    expect(Number.isFinite(f.w)).toBe(true);
    expect(f).toEqual({ x: 0, y: 0, w: 96, h: 96 });
  });
});

describe("analyzeFocus", () => {
  it("Canvas が使えない環境では throw せず安全な中央フォールバックを返す", async () => {
    const src = {} as unknown as CanvasImageSource;
    const portrait = await analyzeFocus(src, 1000, 2000);
    expect(portrait.confident).toBe(false);
    expect(portrait.focusX).toBeCloseTo(0.5);
    expect(portrait.focusY).toBeCloseTo(0.5); // 解析失敗時は推測せず中央

    const landscape = await analyzeFocus(src, 2000, 1000);
    expect(landscape.focusY).toBeCloseTo(0.5);

    const bad = await analyzeFocus(src, 0, 0);
    expect(bad.confident).toBe(false);
  });
});
