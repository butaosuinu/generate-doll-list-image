import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { AspectKey, Template } from "../templates/index.ts";
import {
  drawComposition,
  type DollImage,
  type LabelAnchor,
  type LabelStyle,
  type LoadedImage,
} from "../compose/composeImage.ts";

interface Props {
  template: Template;
  aspect: AspectKey;
  dolls: DollImage[];
  labelStyle: LabelStyle;
  labelAnchor: LabelAnchor;
  background: LoadedImage | null;
}

/** コンテナ幅を購読する。 */
function useContainerWidth(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

export function PreviewCanvas({
  template,
  aspect,
  dolls,
  labelStyle,
  labelAnchor,
  background,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [containerRef, containerWidth] = useContainerWidth();
  const labelId = useId();

  const variant = template.variants[aspect];
  const displayWidth = Math.max(1, Math.min(containerWidth, variant.width));
  const displayHeight = (displayWidth * variant.height) / variant.width;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || containerWidth === 0) return;

    // 名前入力などの連続更新を間引く
    const handle = window.setTimeout(() => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(displayWidth * dpr);
      canvas.height = Math.round(displayHeight * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const scale = (displayWidth * dpr) / variant.width;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      drawComposition(ctx, { template, aspect, dolls, labelStyle, labelAnchor, background });
    }, 60);

    return () => window.clearTimeout(handle);
  }, [
    template,
    aspect,
    dolls,
    labelStyle,
    labelAnchor,
    background,
    displayWidth,
    displayHeight,
    variant,
    containerWidth,
  ]);

  return (
    <div className="preview" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="preview__canvas"
        style={{ width: `${displayWidth}px`, height: `${displayHeight}px` }}
        role="img"
        aria-label={`${template.name} テンプレートのプレビュー`}
        aria-describedby={labelId}
      />
      <p id={labelId} className="preview__caption">
        {dolls.length === 0
          ? "写真を追加するとプレビューが表示されます"
          : `${dolls.length} 体 / ${aspect}`}
      </p>
    </div>
  );
}
