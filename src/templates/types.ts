// 出力アスペクト比のキー。アプリ内でユーザーが切り替える。
export type AspectKey = "16:9" | "4:5" | "1:1";

export const ASPECT_KEYS: readonly AspectKey[] = ["16:9", "4:5", "1:1"] as const;

export const ASPECT_LABELS: Record<AspectKey, string> = {
  "16:9": "16:9 横長",
  "4:5": "4:5 縦長",
  "1:1": "1:1 正方形",
};

/** 0..1 で正規化した矩形（キャンバスサイズに対する割合）。 */
export interface NormRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TextStyle {
  fontFamily: string;
  /** キャンバス高さに対するフォントサイズ比率（アスペクト変化に追従）。 */
  fontSizeRatio: number;
  color: string;
  strokeColor?: string;
  /** 縁取りの太さ（フォントサイズに対する比率）。 */
  strokeRatio?: number;
  align: "left" | "center" | "right";
  /** 折り返しの最大行数。超過分は末尾を「…」で省略。 */
  maxLines: number;
}

export interface GridLayout {
  /** グリッド全体の領域。 */
  area: NormRect;
  /** 列数。0 ならドール枚数とアスペクト比から自動算出。 */
  columns: number;
  /** セル間ギャップ（グリッド領域の幅に対する比率）。 */
  gap: number;
  /** セル内の写真の縦横比 (w / h)。 */
  cellAspect: number;
  /** 写真下のラベル帯の高さ（写真の高さに対する比率）。 */
  labelHeight: number;
}

export interface AspectVariant {
  width: number;
  height: number;
  /** 背景画像の public 相対パス（BASE_URL で解決）。未指定なら背景色のみ。 */
  background?: string;
  /** このアスペクト固有のレイアウト上書き。 */
  layout?: Partial<GridLayout>;
}

export interface TitleStyle {
  rect: NormRect;
  style: TextStyle;
  /** ユーザーがタイトル文言を編集できるか。 */
  editable: boolean;
  /** 既定のタイトル文言。 */
  defaultText?: string;
}

export interface Template {
  id: string;
  name: string;
  /** 背景が無い／読み込み失敗時に全面を塗る色。 */
  backgroundColor: string;
  /** 写真セルの枠線色（未指定なら枠線なし）。 */
  cellBorderColor?: string;
  /** 写真セルの角丸半径（セル幅に対する比率）。 */
  cellCornerRatio?: number;
  defaultLayout: GridLayout;
  defaultTextStyle: TextStyle;
  variants: Record<AspectKey, AspectVariant>;
  title?: TitleStyle;
}

/** 指定アスペクトで有効なレイアウトを解決（variant 上書きを default にマージ）。 */
export function resolveLayout(template: Template, aspect: AspectKey): GridLayout {
  return { ...template.defaultLayout, ...template.variants[aspect].layout };
}
