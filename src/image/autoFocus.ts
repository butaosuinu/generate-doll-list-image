/**
 * ドール写真を画素解析し、正方形クロップが「バストアップ（頭〜胸）」になる
 * 切り抜き中心 focusX/focusY を推定する。完全クライアントサイド・依存ゼロ。
 *
 * 方式は「エッジ密度（ディテール）」ベース。輝度の縦方向勾配を行ごとに集計すると、
 * 顔（目・口・髪の境界）や衣装の質感がある領域は値が高く、無地の背景・床は低い。
 * 上から見て密度が継続的に立ち上がる行を「頭の上端」とみなし、そこを基準に正方形
 * クロップがバストアップになる focusY を逆算する。横方向勾配の重心から focusX を決める。
 *
 * 色背景分離（縁の色を背景とみなす素朴な方式）は、柄物背景・寄り写真・同系色の
 * 実写真で前景が画像全体に広がり top-crop に縮退したため不採用。エッジ密度は
 * 背景の色に依存せず、被写体のディテール位置を直接拾える。精度は「ざっくり」で、
 * 外れた場合はユーザーが手動で微調整できる前提（FocusThumb）。
 *
 * 画素を読む {@link analyzeFocus}（Canvas I/O）と、純計算（テスト対象）を分離する。
 */

/** 元画像 px 座標での矩形。 */
export interface Bbox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FocusResult {
  focusX: number;
  focusY: number;
  /** ディテール（頭）を検出できたか（false はフォールバック値）。 */
  confident: boolean;
}

// --- チューニング定数 ------------------------------------------------------

/** 解析用に縮小する幅(px)。これで十分速く・精度も実用的。 */
const ANALYZE_WIDTH = 100;
/** 行ディテールの平滑化半径（移動平均）。ノイズ起因の偽の立ち上がりを抑える。 */
const SMOOTH_RADIUS = 2;
/** 頭上端判定の閾値比（min..max の何割を超えたら「ディテールあり」とするか）。 */
const HEAD_DETAIL_RATIO = 0.3;
/** 閾値超えが何行連続したら頭上端と確定するか（単発スパイクを弾く）。 */
const HEAD_SUSTAIN_ROWS = 4;

// --- 純関数（Canvas 非依存・ユニットテスト対象）---------------------------

function clamp(v: number, lo: number, hi: number): number {
  if (Number.isNaN(v)) return lo;
  return Math.min(hi, Math.max(lo, v));
}

function clamp01(v: number): number {
  return clamp(v, 0, 1);
}

/** RGBA 画素配列を ITU-R BT.601 輝度（0..255）の配列へ変換する。 */
export function luma(data: Uint8ClampedArray, w: number, h: number): Float32Array {
  const out = new Float32Array(w * h);
  for (let p = 0; p < out.length; p++) {
    const i = p * 4;
    out[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return out;
}

/** 1D 配列の移動平均（半径 r、端は範囲内のみ平均）。 */
export function smooth1d(a: Float32Array, r: number): Float32Array {
  if (r <= 0 || a.length === 0) return a.slice();
  const out = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) {
    let sum = 0;
    let count = 0;
    for (let k = -r; k <= r; k++) {
      const j = i + k;
      if (j >= 0 && j < a.length) {
        sum += a[j];
        count++;
      }
    }
    out[i] = sum / count;
  }
  return out;
}

/**
 * 行ごとの縦方向エッジ密度。各行で「上の行との輝度差の絶対値」を全列平均する。
 * 顔の目・口・髪境界などの横向きエッジが多い行ほど高い。先頭行は次行で代用。
 */
export function rowDetail(lum: Float32Array, w: number, h: number): Float32Array {
  const d = new Float32Array(h);
  for (let y = 1; y < h; y++) {
    let sum = 0;
    const base = y * w;
    const prev = (y - 1) * w;
    for (let x = 0; x < w; x++) sum += Math.abs(lum[base + x] - lum[prev + x]);
    d[y] = sum / w;
  }
  if (h > 1) d[0] = d[1];
  return d;
}

/** 列ごとの横方向エッジ密度。各列で「左の列との輝度差」を全行平均する。 */
export function columnDetail(lum: Float32Array, w: number, h: number): Float32Array {
  const d = new Float32Array(w);
  for (let x = 1; x < w; x++) {
    let sum = 0;
    for (let y = 0; y < h; y++) sum += Math.abs(lum[y * w + x] - lum[y * w + x - 1]);
    d[x] = sum / h;
  }
  if (w > 1) d[0] = d[1];
  return d;
}

/**
 * ディテール領域（頭）の上端インデックスを返す。min..max の `ratio` を閾値に、
 * 上から `sustain` 行連続で閾値を超えた最初の行。検出できなければ -1。
 */
export function detailHeadTop(
  detail: Float32Array,
  ratio = HEAD_DETAIL_RATIO,
  sustain = HEAD_SUSTAIN_ROWS,
): number {
  if (detail.length < sustain + 1) return -1;
  let max = -Infinity;
  let min = Infinity;
  for (const v of detail) {
    if (v > max) max = v;
    if (v < min) min = v;
  }
  if (!(max > min)) return -1; // 完全に平坦＝ディテール無し
  const thresh = min + ratio * (max - min);
  for (let y = 0; y <= detail.length - sustain; y++) {
    let ok = true;
    for (let k = 0; k < sustain; k++) {
      if (detail[y + k] <= thresh) {
        ok = false;
        break;
      }
    }
    if (ok) return y;
  }
  return -1;
}

/** 重み配列のインデックス重心。重み総和が 0 なら中央を返す。 */
export function weightedCentroid(weights: Float32Array): number {
  let num = 0;
  let den = 0;
  for (let i = 0; i < weights.length; i++) {
    num += i * weights[i];
    den += weights[i];
  }
  return den > 0 ? num / den : (weights.length - 1) / 2;
}

export interface FocusFromBboxOpts {
  /** クロップ高に対する頭上の余白（バストアップの「頭の少し上」）。 */
  headroom?: number;
  /** focusY の上限（下がり過ぎ＝頭切れ防止の保険）。 */
  maxFocusY?: number;
}

/**
 * 被写体の上端 y と水平中心 x（共に元 px 座標、`bbox` の x/y で受け取り w/h は
 * 中心算出に使う）から、正方形 cover クロップがバストアップになる focusX/focusY を
 * 逆算する。`coverRect` の sy=(sh-ch)*fy を逆に解く。エッジ密度方式では
 * `{ x: 水平中心, y: 頭上端, w: 0, h: 0 }` の合成 bbox を渡す。
 *
 * 注意: グリッドセルが正方形（全テンプレート `cellAspect: 1`）である前提で
 * クロップ一辺を min(srcW, srcH) としている。`cellAspect !== 1` のテンプレートを
 * 追加する場合は、この逆算と {@link cropFrameRect} をセル比でパラメータ化すること。
 */
export function focusFromBbox(
  bbox: Bbox,
  srcW: number,
  srcH: number,
  opts: FocusFromBboxOpts = {},
): { focusX: number; focusY: number } {
  const headroom = opts.headroom ?? 0.06;
  const maxFocusY = opts.maxFocusY ?? 0.35;
  const side = Math.min(srcW, srcH); // 正方形クロップの一辺（縦長なら = srcW）

  // focusY: 頭の少し上をクロップ上端に合わせる
  const denomY = srcH - side;
  let focusY: number;
  if (denomY > 0) {
    const syWanted = clamp(bbox.y - headroom * side, 0, denomY);
    focusY = Math.min(syWanted / denomY, maxFocusY);
  } else {
    focusY = 0.5;
  }

  // focusX: 被写体の水平中心をクロップ中心に
  const denomX = srcW - side;
  let focusX: number;
  if (denomX > 0) {
    const sxWanted = clamp(bbox.x + bbox.w / 2 - side / 2, 0, denomX);
    focusX = sxWanted / denomX;
  } else {
    focusX = 0.5;
  }

  return { focusX: clamp01(focusX), focusY: clamp01(focusY) };
}

/**
 * サムネイル（contain 表示で dispW×dispH）に重ねる正方形クロップ枠の矩形を
 * 表示座標で返す。`coverRect` と同じ式なので「枠 = 実際の切り抜き範囲」が一致する。
 */
export function cropFrameRect(
  dispW: number,
  dispH: number,
  srcW: number,
  srcH: number,
  fx: number,
  fy: number,
): Bbox {
  // 0 サイズのソース（壊れた <img>・一部 SVG で naturalWidth=0 等）では
  // 0除算で NaN 枠になるため、表示全体を枠として返す。
  if (!(srcW > 0) || !(srcH > 0)) return { x: 0, y: 0, w: dispW, h: dispH };
  const side = Math.min(srcW, srcH);
  const sx = (srcW - side) * clamp01(fx);
  const sy = (srcH - side) * clamp01(fy);
  const scaleX = dispW / srcW;
  const scaleY = dispH / srcH;
  return { x: sx * scaleX, y: sy * scaleY, w: side * scaleX, h: side * scaleY };
}

/**
 * 縮小画素から頭上端 y と水平中心 x を推定する純関数。Canvas 非依存なので
 * テストしやすく、{@link analyzeFocus} はこれに getImageData を渡すだけ。
 * 頭（ディテール領域）を検出できなければ null。
 */
export function locateSubject(data: Uint8ClampedArray, w: number, h: number): Bbox | null {
  const lum = luma(data, w, h);
  const headTop = detailHeadTop(smooth1d(rowDetail(lum, w, h), SMOOTH_RADIUS));
  if (headTop < 0) return null;
  const centroidX = weightedCentroid(columnDetail(lum, w, h));
  return { x: centroidX, y: headTop, w: 0, h: 0 };
}

// --- Canvas I/O ラッパ（jsdom では getImageData 不可 → フォールバック）------

type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;
type AnyCtx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function createAnalysisCanvas(w: number, h: number): AnyCanvas {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function get2dForRead(canvas: AnyCanvas): AnyCtx2D | null {
  if (typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas) {
    return canvas.getContext("2d", { willReadFrequently: true });
  }
  return (canvas as HTMLCanvasElement).getContext("2d", { willReadFrequently: true });
}

/**
 * 画像を解析して推定 focus を返す。例外時（getImageData 不可など）や頭を
 * 検出できないときは throw せず安全な中央フォールバックを返す。
 * 解析器の差し替え用シグネチャ。
 */
export async function analyzeFocus(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
): Promise<FocusResult> {
  // 解析できないときは「どこに被写体がいるか不明」なので、推測で寄せず
  // 安全な中央（従来の既定）に倒す。confident:false が「これは推定でない」目印。
  const fallback: FocusResult = { focusX: 0.5, focusY: 0.5, confident: false };
  if (!(srcW > 0) || !(srcH > 0)) return fallback;

  try {
    const tw = Math.max(1, Math.min(ANALYZE_WIDTH, Math.round(srcW)));
    const th = Math.max(1, Math.round((tw * srcH) / srcW));
    const canvas = createAnalysisCanvas(tw, th);
    const ctx = get2dForRead(canvas);
    if (!ctx) return fallback;
    ctx.drawImage(source, 0, 0, tw, th);
    const { data } = ctx.getImageData(0, 0, tw, th);

    // 頭上端・水平中心は解析解像度で求め、focus は比率なので元解像度でも同値。
    const subject = locateSubject(data, tw, th);
    if (!subject) return fallback;
    const { focusX, focusY } = focusFromBbox(subject, tw, th);
    return { focusX, focusY, confident: true };
  } catch {
    return fallback;
  }
}
