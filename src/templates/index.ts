import type { AspectKey, AspectVariant, Template } from "./types.ts";

export * from "./types.ts";

const DIMENSIONS: Record<AspectKey, { width: number; height: number; file: string }> = {
  "16:9": { width: 1600, height: 900, file: "16x9" },
  "4:5": { width: 1080, height: 1350, file: "4x5" },
  "1:1": { width: 1080, height: 1080, file: "1x1" },
};

/**
 * 各アスペクトの variant を生成。背景画像は public/templates/<id>-<aspect>.png を参照し、
 * 未配置なら loadBackground が null を返して backgroundColor にフォールバックする。
 * 縦長・正方形はタイトル/余白を詰めるため area をやや広げる。
 */
function makeVariants(id: string): Record<AspectKey, AspectVariant> {
  return {
    "16:9": {
      ...sizeOf("16:9"),
      background: `templates/${id}-16x9.png`,
      layout: { area: { x: 0.06, y: 0.17, w: 0.88, h: 0.76 } },
    },
    "4:5": {
      ...sizeOf("4:5"),
      background: `templates/${id}-4x5.png`,
      layout: { area: { x: 0.06, y: 0.13, w: 0.88, h: 0.81 } },
    },
    "1:1": {
      ...sizeOf("1:1"),
      background: `templates/${id}-1x1.png`,
      layout: { area: { x: 0.06, y: 0.15, w: 0.88, h: 0.79 } },
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
      area: { x: 0.06, y: 0.17, w: 0.88, h: 0.76 },
      columns: 0,
      gap: 0.025,
      cellAspect: 1,
      labelHeight: 0.26,
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
    title: {
      rect: { x: 0.05, y: 0.04, w: 0.9, h: 0.1 },
      editable: true,
      defaultText: "My Dolls",
      style: {
        fontFamily: '"Hiragino Sans", "Noto Sans JP", system-ui, sans-serif',
        fontSizeRatio: 0.06,
        color: "#c45e86",
        strokeColor: "#ffffff",
        strokeRatio: 0.1,
        align: "center",
        maxLines: 1,
      },
    },
    variants: makeVariants("pastel"),
  },
  {
    id: "night",
    name: "ナイト",
    backgroundColor: "#13131f",
    cellBorderColor: "#3a3a5a",
    cellCornerRatio: 0.06,
    defaultLayout: {
      area: { x: 0.06, y: 0.17, w: 0.88, h: 0.76 },
      columns: 0,
      gap: 0.025,
      cellAspect: 1,
      labelHeight: 0.26,
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
    title: {
      rect: { x: 0.05, y: 0.04, w: 0.9, h: 0.1 },
      editable: true,
      defaultText: "Collection",
      style: {
        fontFamily: '"Hiragino Sans", "Noto Sans JP", system-ui, sans-serif',
        fontSizeRatio: 0.06,
        color: "#9ad8ff",
        strokeColor: "#000000",
        strokeRatio: 0.12,
        align: "center",
        maxLines: 1,
      },
    },
    variants: makeVariants("night"),
  },
  {
    id: "kraft",
    name: "クラフト",
    backgroundColor: "#efe4d2",
    cellBorderColor: "#c7b299",
    cellCornerRatio: 0.04,
    defaultLayout: {
      area: { x: 0.06, y: 0.17, w: 0.88, h: 0.76 },
      columns: 0,
      gap: 0.03,
      cellAspect: 1,
      labelHeight: 0.26,
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
    title: {
      rect: { x: 0.05, y: 0.04, w: 0.9, h: 0.1 },
      editable: true,
      defaultText: "ドール一覧",
      style: {
        fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif',
        fontSizeRatio: 0.055,
        color: "#6b4f33",
        strokeColor: "#efe4d2",
        strokeRatio: 0.1,
        align: "center",
        maxLines: 1,
      },
    },
    variants: makeVariants("kraft"),
  },
];

export const DEFAULT_TEMPLATE_ID = TEMPLATES[0].id;

export function getTemplate(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
