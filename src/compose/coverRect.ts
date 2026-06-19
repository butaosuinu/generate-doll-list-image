export interface SourceCrop {
  sx: number;
  sy: number;
  cw: number;
  ch: number;
}

/**
 * object-fit: cover 相当のソース切り出し矩形を計算する。
 * 描画先 (dw×dh) を埋めるようソース (sw×sh) を拡大し、はみ出す分を
 * focus 位置 (fx, fy ∈ 0..1) を基準に切り取る。
 *
 *   const { sx, sy, cw, ch } = coverRect(img.width, img.height, dw, dh);
 *   ctx.drawImage(img, sx, sy, cw, ch, dx, dy, dw, dh);
 */
export function coverRect(
  sw: number,
  sh: number,
  dw: number,
  dh: number,
  fx = 0.5,
  fy = 0.5,
): SourceCrop {
  if (sw <= 0 || sh <= 0 || dw <= 0 || dh <= 0) {
    return { sx: 0, sy: 0, cw: Math.max(0, sw), ch: Math.max(0, sh) };
  }
  const scale = Math.max(dw / sw, dh / sh);
  const cw = dw / scale;
  const ch = dh / scale;
  const sx = (sw - cw) * clamp01(fx);
  const sy = (sh - ch) * clamp01(fy);
  return { sx, sy, cw, ch };
}

function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0.5;
  return Math.min(1, Math.max(0, v));
}
