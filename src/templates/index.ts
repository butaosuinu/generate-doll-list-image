import type { AspectKey, AspectVariant, Template } from "./types.ts";

export * from "./types.ts";

const DIMENSIONS: Record<AspectKey, { width: number; height: number; file: string }> = {
  "16:9": { width: 1600, height: 900, file: "16x9" },
  "4:5": { width: 1080, height: 1350, file: "4x5" },
  "1:1": { width: 1080, height: 1080, file: "1x1" },
};

/**
 * 各アスペクトの variant を生成。背景画像は public/templates/<id>-<aspect>.jpg を参照し、
 * 未配置なら loadBackground が null を返して backgroundColor にフォールバックする。
 * タイトルを廃したぶん余白を詰め、写真が大きくなるよう area をほぼ全面に広げる
 * （背景テンプレの装飾縁を残すため端に薄くマージンを取る）。
 */
function makeVariants(id: string): Record<AspectKey, AspectVariant> {
  return {
    "16:9": {
      ...sizeOf("16:9"),
      background: `templates/${id}-16x9.jpg`,
      layout: { area: { x: 0.035, y: 0.04, w: 0.93, h: 0.92 } },
    },
    "4:5": {
      ...sizeOf("4:5"),
      background: `templates/${id}-4x5.jpg`,
      layout: { area: { x: 0.035, y: 0.03, w: 0.93, h: 0.94 } },
    },
    "1:1": {
      ...sizeOf("1:1"),
      background: `templates/${id}-1x1.jpg`,
      layout: { area: { x: 0.035, y: 0.035, w: 0.93, h: 0.93 } },
    },
  };
}

function sizeOf(aspect: AspectKey): { width: number; height: number } {
  return { width: DIMENSIONS[aspect].width, height: DIMENSIONS[aspect].height };
}

export const TEMPLATES: Template[] = [
  {
    id: "pastel",
    name: "パステル",
    backgroundColor: "#fbeff2",
    cellBorderColor: "#ffffff",
    cellCornerRatio: 0.06,
    defaultLayout: {
      area: { x: 0.035, y: 0.04, w: 0.93, h: 0.92 },
      columns: 0,
      gap: 0.014,
      cellAspect: 1,
      labelHeight: 0.3,
    },
    defaultTextStyle: {
      fontFamily: '"Hiragino Sans", "Noto Sans JP", system-ui, sans-serif',
      fontSizeRatio: 0.03,
      color: "#5b3a52",
      strokeColor: "#ffffff",
      strokeRatio: 0.16,
      align: "center",
      maxLines: 2,
    },
    labelBoxColor: "rgba(255,255,255,0.66)",
    variants: makeVariants("pastel"),
  },
  {
    id: "night",
    name: "ナイト",
    backgroundColor: "#13131f",
    cellBorderColor: "#3a3a5a",
    cellCornerRatio: 0.06,
    defaultLayout: {
      area: { x: 0.035, y: 0.04, w: 0.93, h: 0.92 },
      columns: 0,
      gap: 0.014,
      cellAspect: 1,
      labelHeight: 0.3,
    },
    defaultTextStyle: {
      fontFamily: '"Hiragino Sans", "Noto Sans JP", system-ui, sans-serif',
      fontSizeRatio: 0.03,
      color: "#f2f2ff",
      strokeColor: "#000000",
      strokeRatio: 0.18,
      align: "center",
      maxLines: 2,
    },
    labelBoxColor: "rgba(10,12,24,0.5)",
    variants: makeVariants("night"),
  },
  {
    id: "kraft",
    name: "クラフト",
    backgroundColor: "#efe4d2",
    cellBorderColor: "#c7b299",
    cellCornerRatio: 0.04,
    defaultLayout: {
      area: { x: 0.035, y: 0.04, w: 0.93, h: 0.92 },
      columns: 0,
      gap: 0.014,
      cellAspect: 1,
      labelHeight: 0.3,
    },
    defaultTextStyle: {
      fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif',
      fontSizeRatio: 0.03,
      color: "#4a3a28",
      strokeColor: "#efe4d2",
      strokeRatio: 0.14,
      align: "center",
      maxLines: 2,
    },
    labelBoxColor: "rgba(244,236,222,0.7)",
    variants: makeVariants("kraft"),
  },
  {
    id: "modern",
    name: "モダンクール",
    backgroundColor: "#e9edf2",
    cellBorderColor: "#ffffff",
    cellCornerRatio: 0.04,
    defaultLayout: {
      area: { x: 0.035, y: 0.04, w: 0.93, h: 0.92 },
      columns: 0,
      gap: 0.014,
      cellAspect: 1,
      labelHeight: 0.3,
    },
    defaultTextStyle: {
      fontFamily: '"Hiragino Sans", "Noto Sans JP", system-ui, sans-serif',
      fontSizeRatio: 0.03,
      color: "#2c313a",
      strokeColor: "#ffffff",
      strokeRatio: 0.16,
      align: "center",
      maxLines: 2,
    },
    labelBoxColor: "rgba(255,255,255,0.68)",
    variants: makeVariants("modern"),
  },
  {
    id: "aqua",
    name: "アクア",
    backgroundColor: "#e8f3fb",
    cellBorderColor: "#ffffff",
    cellCornerRatio: 0.06,
    defaultLayout: {
      area: { x: 0.035, y: 0.04, w: 0.93, h: 0.92 },
      columns: 0,
      gap: 0.014,
      cellAspect: 1,
      labelHeight: 0.3,
    },
    defaultTextStyle: {
      fontFamily: '"Hiragino Sans", "Noto Sans JP", system-ui, sans-serif',
      fontSizeRatio: 0.03,
      color: "#1c5275",
      strokeColor: "#ffffff",
      strokeRatio: 0.16,
      align: "center",
      maxLines: 2,
    },
    labelBoxColor: "rgba(255,255,255,0.66)",
    variants: makeVariants("aqua"),
  },
  {
    id: "wamodern",
    name: "和モダン",
    backgroundColor: "#f4efe4",
    cellBorderColor: "#cbbfa8",
    cellCornerRatio: 0.04,
    defaultLayout: {
      area: { x: 0.035, y: 0.04, w: 0.93, h: 0.92 },
      columns: 0,
      gap: 0.014,
      cellAspect: 1,
      labelHeight: 0.3,
    },
    defaultTextStyle: {
      fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif',
      fontSizeRatio: 0.03,
      color: "#2b2620",
      strokeColor: "#f4efe4",
      strokeRatio: 0.14,
      align: "center",
      maxLines: 2,
    },
    labelBoxColor: "rgba(244,239,228,0.7)",
    variants: makeVariants("wamodern"),
  },
];

export const DEFAULT_TEMPLATE_ID = TEMPLATES[0].id;

export function getTemplate(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
