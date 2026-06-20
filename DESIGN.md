# DESIGN.md

このドキュメントは、**アプリの操作画面（UI）のビジュアルデザイン**を言語化したものです。
生成される「ドール一覧画像」そのもの（テンプレート・合成仕様）は対象外で、それらは `CLAUDE.md` の Architecture / Templates 節を参照してください。

- **CLAUDE.md** … 設計・開発（アーキテクチャ、コマンド、規約）
- **DESIGN.md**（本書）… 見た目（テーマ、デザイントークン、コンポーネントの見え方）

> デザインの実体は **`src/index.css`** に集約されています（マークアップの BEM クラスは据え置き、スタイルのみで定義）。本書の数値は同ファイルからの転記です。**値を変更したら、CSS と本書を同期させてください。**

---

## 1. デザインコンセプト

テーマ名は **"Soft Glow Kawaii"** — *暖色オーロラ × グラスモーフィズム × 丸ゴシック*。

ドールの写真を扱う、個人的で愛着のあるツールにふさわしい、やわらかく華やかな雰囲気を狙う。具体的には次の3要素の重なりで作る:

- **暖色オーロラ** … ページ全体をピンク〜ピーチ〜ラベンダーのグラデーションで発光させ、明るく親しみのある空気を作る。
- **グラスモーフィズム** … 操作パネルは半透明の磨りガラスにし、背景のグラデーションを透かして奥行きを出す。
- **丸ゴシック** … 本文に丸みのある Zen Maru Gothic を使い、角の立たない柔らかい印象に統一する。

---

## 2. デザイン原則

1. **背景は透ける。** パネルやフィールドは不透明にせず、`backdrop-filter` の磨りガラスで背後のオーロラを透かす。UI が背景から浮いた板にならないようにする。
2. **暖色グラデーションで導く。** 主要アクション（ボタン・選択中チップ・見出しのアクセント）はコーラル→ピーチのグラデーションで塗り、視線と操作を誘導する。
3. **角は大きく丸める。** パネルは 26px、カード/ボタンは 16px、押せるピル要素は 999px。鋭角を作らない。
4. **操作はスプリングで弾ませる。** hover/active で `translateY` + `scale` を効かせ、`cubic-bezier(.34,1.56,.64,1)`（オーバーシュート）で弾むフィードバックを返す。
5. **ライトテーマ固定。** UI 本体は常に明るい暖色。暗い世界観はあくまで出力画像のテンプレート（ナイト等）側で表現し、操作画面は切り替えない。
6. **安心を可視化する。** 「サーバー送信なし」という完全クライアントサイドの性質を、ヘッダーの緑バッジで明示する。

---

## 3. デザイントークン

すべて `src/index.css` の `:root` に CSS カスタムプロパティとして定義。

### テキスト色

| トークン | 値 | 用途 |
|---|---|---|
| `--ink` | `#6a4658` | 主テキスト（濃い紫みのスミレ） |
| `--ink-2` | `#9b7385` | 副次テキスト・ラベル |
| `--ink-3` | `#bb9caa` | 補助テキスト・キャプション・プレースホルダ |

### ブランド / アクセント

| トークン | 値 | 用途 |
|---|---|---|
| `--coral` | `#ff7eb0` | 主アクセント（コーラルピンク） |
| `--coral-deep` | `#ef5d99` | 濃いコーラル（テキスト/アイコンの強調） |
| `--coral-tint` | `rgba(255,126,176,.14)` | フォーカスリングの淡いコーラル |
| `--peach` | `#ff9e7a` | 副アクセント（グラデーションの相方） |
| `--lav` | `#b79bff` | 第3アクセント（ラベンダー。見出しグラデの締め） |

### グラス面（すべて白の半透明）

| トークン | 値 | 用途 |
|---|---|---|
| `--glass` | `rgba(255,255,255,.56)` | 標準のグラスパネル背景 |
| `--glass-strong` | `rgba(255,255,255,.74)` | 強めのグラス（バッジ等） |
| `--glass-border` | `rgba(255,255,255,.72)` | グラスのふち |
| `--field` | `rgba(255,255,255,.62)` | 入力フィールド背景 |

### ステータス色

| トークン | 値 | 用途 |
|---|---|---|
| `--green` | `#2f9e6f` | 安心・成功（プライバシーバッジ） |
| `--danger` | `#e8537e` | 破壊的操作・エラー（削除・全削除・エラー文） |

### 形状（角丸・影）

| トークン | 値 | 用途 |
|---|---|---|
| `--radius` | `26px` | パネル・ドロップゾーンの大きな角丸 |
| `--radius-sm` | `16px` | カード・フィールド・ボタンの角丸 |
| `--radius-xs` | `13px` | エラーボックス等の小さな角丸 |
| `--shadow` | `0 10px 32px rgba(220,120,165,.2)` | 標準のソフトな影（ほんのりピンク） |
| `--shadow-pop` | `0 18px 44px rgba(220,110,160,.3)` | より強い浮き上がりの影 |

> ピル型（完全な丸み）の要素は `border-radius: 999px` を直接指定（トークン化していない）。

### タイポグラフィ（フォント）

| トークン | 値 | 用途 |
|---|---|---|
| `--round` | `"Zen Maru Gothic", system-ui, sans-serif` | 本文・見出し（丸ゴシック） |
| `--quick` | `"Quicksand", "Zen Maru Gothic", system-ui, sans-serif` | ラベル・ボタン・チップ（幾何学サンセリフ） |

### モーション（イージング）

| トークン | 値 | 用途 |
|---|---|---|
| `--spring` | `cubic-bezier(.34,1.56,.64,1)` | 弾む動き（transform 系の hover/active） |
| `--ease` | `cubic-bezier(.22,.61,.36,1)` | 滑らかな動き（色・影・背景の遷移） |

ルート既定: `font-family: var(--round)` / `line-height: 1.65` / `color: var(--ink)`。

---

## 4. 背景と空気感

ページ全体（`body`）で「中央にコンテンツ、周囲を暖色で発光」させる。

- **ベース色**: `#ffe7da`（ウォームピーチ）。
- **オーロラ（放射状グラデ4層、`background-image`）**:

  | 位置 | 色 | 役割 |
  |---|---|---|
  | `12% 0%`（左上） | `rgba(255,209,227,.95)` | ピンクの光 |
  | `92% 8%`（右上） | `rgba(255,198,168,.9)` | ピーチの光 |
  | `78% 100%`（右下） | `rgba(183,155,255,.55)` | ラベンダーの光 |
  | `20% 95%`（左下） | `rgba(255,158,122,.5)` | オレンジの光 |

- **`background-attachment: fixed`** … スクロールしても光が動かず、コンテンツだけが流れる。
- **グレイン** … `body::before` に SVG フラクタルノイズ（`opacity: 0.4`、`pointer-events: none`）を敷き、のっぺりしない質感を足す。
- **アンチエイリアス** … `-webkit-font-smoothing: antialiased` / `text-rendering: optimizeLegibility`。

---

## 5. タイポグラフィ

### フォントの使い分け

- **本文・見出し**: `--round`（Zen Maru Gothic）。柔らかい丸ゴシックで親しみを出す。
- **ラベル・ボタン・チップ・キャプション**: `--quick`（Quicksand）。幾何学的サンセリフで、操作要素を一段クールに引き締める。

### サイズスケール

| 要素 | サイズ | 補足 |
|---|---|---|
| ページ見出し `h1` | `clamp(1.9rem, 5.2vw, 3.1rem)` | 流体。`line-height: 1.14` / `letter-spacing: .01em` |
| パネル見出し `.panel__title` | `1.4rem` | weight 900 |
| ラベル `.panel__label` | `0.8rem` | `letter-spacing: .04em`、Quicksand |
| 入力テキスト | `0.95rem` | 本文フォント |
| チップ `.picker__chip` | `0.92rem` | — |
| 書き出しボタン | `0.98rem` | — |
| キャプション `.preview__caption` | `0.82rem` | — |

### ウェイト

- **900** … `h1`、パネル見出し（最も強い階層）
- **700** … ラベル・チップ・ボタン・ヒント（操作要素）
- **600** … キャプション・エラー文
- **500** … 本文・補足・サブタイトル

### 見出しのグラデーションテキスト

`h1` は `linear-gradient(120deg, var(--coral-deep), var(--peach) 58%, var(--lav))` を `background-clip: text` で文字に流し込む。clip 非対応環境では `color: var(--coral-deep)` にフォールバック。

---

## 6. レイアウトシステム

ルート `.app` … `max-width: 1140px` / `margin: 0 auto` / `padding: 48px 18px 64px`。背景グレイン（z-index:0）の上に乗るよう `position: relative; z-index: 1`。

### 画面構成（`src/App.tsx`）

```
.app
├─ header.app__header        中央寄せ。h1 + サブ + プライバシーバッジ
├─ main.app__main            1カラム ↔ 2カラム
│  ├─ section.panel          左: 「写真」— DropZone / DollListEditor / すべて削除
│  └─ section.panel          右: 「デザイン」+「出力」
│        ├─ TemplatePicker / AspectPicker / タイトル入力
│        ├─ PreviewCanvas
│        └─ ExportPanel
└─ footer.app__footer        注意書き（ブラウザ内生成・X 投稿手順）
```

### レスポンシブ（ブレークポイント = 880px）

| 画面幅 | `.app__main` |
|---|---|
| 〜879px | 1カラム（`grid-template-columns: 1fr`、`gap: 22px`） |
| 880px〜 | 2カラム `minmax(320px,1fr) minmax(360px,1.2fr)`、`align-items: start` |

左（写真入力）はやや狭く、右（デザイン/プレビュー/出力）をやや広く取る（1 : 1.2）。

---

## 7. コンポーネント仕様

各コンポーネントを「役割 → 見た目 → 状態変化」で記述。

### パネル `.panel`

- **役割**: すべての操作を載せる磨りガラスの土台。
- **見た目**: `background: var(--glass)` + `backdrop-filter: blur(22px) saturate(1.4)`、`border: 1.5px solid var(--glass-border)`、`border-radius: 26px`、`padding: 24px 22px`。影は `var(--shadow)` に `inset 0 1px 0 rgba(255,255,255,.8)`（上辺のハイライト）を重ねる。
- **見出し `.panel__title`**: 左に `::before` の縦バー（9×22px、コーラル→ピーチのグラデ + glow）。2つ目以降の見出しは上に `margin-top: 26px` と破線ボーダー（`1.5px dashed rgba(255,158,200,.45)`）で区切る。

### フィールド（`.panel__field` / `.export__field` の input・textarea）

- **見た目**: `background: var(--field)`、`border: 1.5px solid var(--glass-border)`、`border-radius: 16px`、`padding: 12px 15px`。プレースホルダは `--ink-3`。
- **focus**: `outline: none` にし、`border-color: var(--coral)` + 背景 `#fff` + `box-shadow: 0 0 0 4px var(--coral-tint)`（コーラルのフォーカスリング）。textarea は `resize: vertical`、`min-height: 62px`。

### DropZone `.dropzone`

- **役割**: 写真のドラッグ&ドロップ / ファイル選択。
- **見た目**: `2px dashed rgba(255,145,190,.6)` の破線枠、`border-radius: 26px`、半透明背景。
- **hover**: 枠が `--coral` に、背景が濃くなり、`transform: scale(1.01)`。
- **`--over`（ドラッグ中）**: 枠が**実線**のコーラルに変わり、背景がピンク（`rgba(255,230,240,.7)`）、`scale(1.012)`。
- **`--disabled`（上限到達）**: `opacity: 0.6`、hover で動かない。
- **ボタン `.dropzone__button`**: ピル型（999px）、`linear-gradient(135deg, var(--coral), var(--peach))`、白文字、`box-shadow: 0 12px 24px -8px rgba(255,126,176,.8)`。hover で `translateY(-3px) scale(1.04)` + `brightness(1.05)`、active で `scale(.98)` の押し込み。
- **テキスト**: `.dropzone__text`（補足、`--ink-2`）/ `.dropzone__hint`（枚数、`--coral-deep`・太字）。

### DollListEditor `.editor`

- **役割**: 追加済みドールの並べ替え・改名・削除。
- **空状態 `.editor__empty`**: 破線枠の中央寄せプレースホルダ（`--ink-3`）。
- **行 `.editor__item`**: 半透明カード、`border-radius: 16px`、`gap: 12px`。**hover で `translateX(3px)`**（右へスライド）+ 背景を濃く + 透明だった枠が `--glass-border` に。
- **サムネ `.editor__thumb`**: 50×50px、`border-radius: 14px`、`object-fit: cover`。`box-shadow: 0 0 0 3px #fff, 0 6px 14px -4px rgba(255,126,176,.45)`（白フチ + ピンクの glow）。
- **名前入力 `.editor__name`**: 行内で `flex: 1`。focus はフィールド共通のコーラルリング。
- **操作ボタン `.editor__actions button`**: 34×34px の角丸正方形。hover で `translateY(-2px) scale(1.08)` + `--coral-deep`。**削除ボタン `.editor__remove` の hover は `--danger`**（赤ピンク）で危険を示す。

### Picker（TemplatePicker / AspectPicker）`.picker` / `.picker__chip`

- **役割**: テンプレート・アスペクト比をチップで選択。
- **チップ**: ピル型（999px）、半透明背景 + `2px` の白枠、Quicksand 太字。
- **hover**: `translateY(-2px)`、文字 `--coral-deep`、枠がピンクに。
- **`--active`（選択中）**: 白文字 + コーラル→ピーチのグラデ塗り + 白枠、`box-shadow: 0 0 0 2px var(--coral)` の外枠と glow。
  - 注: テンプレチップは固有色を inline で持つ場合があり、その際は塗りではなく枠+glow で選択を示す。アスペクトチップ（inline 無し）はグラデ塗りになる。

### PreviewCanvas `.preview` / `.preview__canvas`

- **役割**: 生成結果の実寸プレビュー（中央寄せ）。
- **キャンバス**: `max-width: 100%`、`border-radius: 18px`、`background: linear-gradient(160deg, #fff2f6, #ffe6ef)`（読込中の下地）。
- **額装**: `box-shadow` を3枚重ねて「白マット + glow の額」を表現（レイアウトに影響しない）:
  `0 0 0 1px rgba(255,255,255,.9)`（細い白線）/ `0 0 0 10px rgba(255,255,255,.55)`（厚い白マット）/ `0 18px 44px -10px rgba(220,110,160,.4)`（落ち影）。
- **キャプション `.preview__caption`**: `--ink-3` の小さな注記。

### ExportPanel `.export`

- **役割**: 形式選択（JPEG/PNG）と、ダウンロード/共有。
- **形式ラジオ `.export__format label`**: 角丸（16px）のチップ風ラベル。`input[type=radio]` は `accent-color: var(--coral)`。**`label:has(input:checked)`** で選択ラベルを `--coral-deep` 文字 + ピンク背景 + コーラル枠に。
- **ボタン `.export__buttons button`**: 既定はピル型のアウトライン（`--coral-deep` 文字）。hover で `translateY(-3px)` + `var(--shadow)`。
- **主ボタン `.export__primary`**: コーラル→ピーチのグラデ塗り（`!important` で上書き）、白文字、強い glow。hover で `translateY(-3px) scale(1.02)` + `brightness(1.05)`。
- **エラー `.export__error`**: `--danger` 文字 + 薄い赤背景 + 赤枠、`border-radius: 13px`。
- **ガイド `.export__guide`**: 共有非対応時などの手順を、半透明背景の角丸ボックスで提示。

### PrivacyNote `.privacy`

- **役割**: 「画像はブラウザ内で完結＝サーバー送信なし」を冒頭で明示し、安心を与える。
- **見た目**: ピル型の緑バッジ。`color: var(--green)`、`background: var(--glass-strong)`、緑の薄枠（`rgba(47,158,111,.24)`）、`backdrop-filter: blur(8px)`、`var(--shadow)`。

### Footer `.app__footer`

中央寄せの小さな注意書き（`--ink-3`、`0.82rem`）。

---

## 8. インタラクション / モーション

操作のフィードバックは一貫したルールで与える。

| 状態 | 効果 |
|---|---|
| **hover** | `translateY(-2〜3px)`（浮く）+ 必要に応じ `scale(1.01〜1.08)` + `brightness(1.05)`。色・枠もアクセント寄りに。 |
| **active** | `scale(.98)` 前後の押し込み（例: ドロップゾーンのボタン）。 |
| **focus** | `outline` は消し、代わりに `box-shadow: 0 0 0 4px var(--coral-tint)` のコーラルリングで可視化。 |
| **drag over** | ドロップゾーンが実線コーラル枠 + ピンク背景に変化。 |

イージングの使い分け:

- **`--spring`**（弾む / オーバーシュート） … `transform`（hover の浮き、active の押し込み）。
- **`--ease`**（滑らか） … 色・背景・影・枠線の遷移。

遷移時間はおおむね `0.16〜0.28s`。透明度の落とし方など派手すぎる動きは避け、軽い弾みに留める。

---

## 9. アクセシビリティ / 状態の配慮

- **フォーカスの可視化**: ブラウザ既定の outline を消す代わりに、入力系は必ずコーラルのフォーカスリングを付与（キーボード操作で迷子にならない）。
- **無効状態**: グローバルに `button:disabled { cursor: not-allowed; opacity: .5 }`。ドロップゾーンは上限到達で `--disabled`（`opacity: .6`、hover 無反応）。
- **領域のラベリング**: 2つの `section.panel` に `aria-label`（「写真の追加と編集」「デザインと出力」）を付与し、スクリーンリーダーで領域を区別できるようにする（`src/App.tsx`）。
- **色だけに頼らない**: 危険操作は色（`--danger`）に加えて削除アイコン/「すべて削除」の文言でも示す。
- **コントラスト**: 明るい背景に対し本文は `--ink`（濃いスミレ）を基準にし、補助情報のみ薄い `--ink-2 / --ink-3` を使う。

---

*このデザインの単一の出典は `src/index.css` です。トークンやコンポーネントの見た目を変更する際は、本書の該当箇所も併せて更新してください。*
