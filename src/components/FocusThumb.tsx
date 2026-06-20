import { useRef } from "react";
import { cropFrameRect } from "../image/autoFocus.ts";

interface Props {
  src: string;
  /** 元画像の幅・高さ（px）。クロップ枠の計算に使う。 */
  width: number;
  height: number;
  focusX: number;
  focusY: number;
  /** aria 用の見出し（例「1 体目」）。 */
  label?: string;
  onChange: (focusX: number, focusY: number) => void;
}

/** サムネイルの最大辺(px)。元の 50px より大きめにして操作しやすく。 */
const MAX_DIM = 96;
/**
 * 可動域(px)がこれ未満の軸はドラッグが過敏になる（1px の移動で focus が大きく飛ぶ）
 * ので固定扱いにする。ほぼ正方形の写真は切り抜き余地が小さく調整不要なため妥当。
 */
const MIN_RANGE_PX = 8;

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

/** 元画像のアスペクト比を保った表示サイズ（最大辺 MAX_DIM）。 */
function displaySize(w: number, h: number): { dw: number; dh: number } {
  if (!(w > 0) || !(h > 0)) return { dw: MAX_DIM, dh: MAX_DIM };
  if (w >= h) return { dw: MAX_DIM, dh: Math.round((MAX_DIM * h) / w) };
  return { dw: Math.round((MAX_DIM * w) / h), dh: MAX_DIM };
}

/**
 * 写真全体をサムネイル表示し、上に「実際の切り抜き範囲（正方形）」の枠を重ねる。
 * 枠はドラッグ／スライダーで動かせ、`coverRect` と同じ式（cropFrameRect）なので
 * プレビュー・書き出しの切り抜きと必ず一致する。
 */
export function FocusThumb({ src, width, height, focusX, focusY, label, onChange }: Props) {
  const { dw, dh } = displaySize(width, height);
  // 注意: グリッドセルが正方形（cellAspect:1）前提のクロップ枠。
  const frame = cropFrameRect(dw, dh, width, height, focusX, focusY);
  // 枠が動ける表示px範囲。MIN_RANGE_PX 未満は固定扱い（過敏ドラッグ防止）。
  const rangeX = dw - frame.w;
  const rangeY = dh - frame.h;
  const movableX = rangeX >= MIN_RANGE_PX;
  const movableY = rangeY >= MIN_RANGE_PX;
  const movable = movableX || movableY;
  const dragRef = useRef<{ startX: number; startY: number; fx: number; fy: number } | null>(null);

  const sliderAxis = movableY ? "y" : movableX ? "x" : null;

  return (
    <div className="focus-thumb-wrap">
      <div
        className={`focus-thumb${movable ? "" : " focus-thumb--static"}`}
        style={{ width: dw, height: dh }}
        onPointerDown={(e) => {
          if (!movable) return; // 正方形/ほぼ正方形は動かせない
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          dragRef.current = { startX: e.clientX, startY: e.clientY, fx: focusX, fy: focusY };
        }}
        onPointerMove={(e) => {
          const d = dragRef.current;
          if (!d) return;
          const nx = movableX ? d.fx + (e.clientX - d.startX) / rangeX : d.fx;
          const ny = movableY ? d.fy + (e.clientY - d.startY) / rangeY : d.fy;
          onChange(clamp01(nx), clamp01(ny));
        }}
        onPointerUp={(e) => {
          dragRef.current = null;
          e.currentTarget.releasePointerCapture(e.pointerId);
        }}
        onPointerCancel={() => {
          dragRef.current = null;
        }}
      >
        <img className="focus-thumb__img" src={src} alt="" draggable={false} />
        <div
          className="focus-thumb__frame"
          style={{ left: frame.x, top: frame.y, width: frame.w, height: frame.h }}
          aria-hidden="true"
        />
      </div>
      {sliderAxis && (
        <input
          className="focus-thumb__range"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={sliderAxis === "y" ? focusY : focusX}
          aria-label={`${label ?? "写真"}の切り抜き${sliderAxis === "y" ? "上下" : "左右"}位置`}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (sliderAxis === "y") onChange(focusX, v);
            else onChange(v, focusY);
          }}
        />
      )}
    </div>
  );
}
