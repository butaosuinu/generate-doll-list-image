# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

ドールの写真と名前を、X (旧 Twitter) 投稿向けの一枚の「ドール一覧画像」に合成する、**フロントエンドのみ**の Web ツール。画像処理はすべてブラウザ内で完結し、サーバーには何も送信しない。GitHub Pages で公開する想定。

## Commands

パッケージマネージャは **pnpm** に固定 (`packageManager: pnpm@11.6.0`)。corepack 経由で使い、npm/yarn で代替しないこと。

| 目的 | コマンド |
|------|---------|
| 依存インストール | `pnpm install` |
| 開発サーバ | `pnpm run dev` |
| 本番ビルド (型チェック込み) | `pnpm run build` (`tsc -b && vite build`) |
| ビルド結果のプレビュー | `pnpm run preview` |
| テスト (一回) | `pnpm run test` (`vitest run`) |
| テスト (watch) | `pnpm run test:watch` |
| Lint | `pnpm run lint` (oxlint) |
| Format (上書き) | `pnpm run format` (oxfmt) |
| Format チェックのみ | `pnpm run format:check` |

- Lint/Format は **oxlint / oxfmt** (Rust 製)。ESLint / Prettier は使わない。設定は `.oxlintrc.json` / `.oxfmtrc.json`。
- 単一テストファイル: `pnpm exec vitest run src/compose/layout.test.ts`
- テスト名で絞る: `pnpm exec vitest run -t "<test name>"`
- テストは jsdom 環境 + Vitest globals (`describe/it/expect` は import 不要)。設定は `vite.config.ts` に同梱。

## Architecture

React 19 (関数コンポーネント + hooks のみ) + Vite + TypeScript (strict)。状態管理ライブラリは使わず素の `useState` / カスタム hook。スタイルは素の CSS (`src/index.css`)。

### レイヤ構成

- `src/components/` — UI (入力・プレビュー・選択・出力)
- `src/state/useDollList.ts` — ドール一覧の状態 (中核データ。最大24体)
- `src/compose/` — **フレームワーク非依存**の画像合成コア (Canvas 2D)
- `src/templates/` — テンプレートの型定義とデータ
- `src/image/` — 画像読み込み (EXIF 回転・縮小) とダウンロード
- `src/share/` — X 投稿 Intent / Web Share

### 中核: 合成パイプライン (複数ファイルを読まないと掴めない部分)

`src/compose/composeImage.ts` の **`drawComposition()` が描画の単一の中心**。背景 → タイトル → 写真グリッド → 名前ラベル の順に Canvas へ描く。これを 2 経路で再利用する:

- **プレビュー** (`src/components/PreviewCanvas.tsx`): コンテナ幅に縮小 + devicePixelRatio スケール、60ms デバウンス。
- **書き出し** (`composeToBlob()`): フル解像度 (例 1600×900) の Canvas で PNG/JPEG Blob を生成。

`drawComposition()` が依存する純関数 (いずれもユニットテスト対象):
- `layout.ts` — グリッド配置計算。`autoColumns()` が写真が最大になる列数を選び、`resolveGrid()` が各セルの矩形 (px) を返す。
- `coverRect.ts` — `object-fit: cover` 相当のクロップ計算 (focus point 対応)。
- `drawText.ts` — CJK は文字単位 / ASCII は単語単位の折り返し、`maxLines` 超過は「…」省略、stroke 縁取り描画。

座標は `NormRect` (0..1 正規化, `src/templates/types.ts`) で定義し、`composeImage.ts` 内の `normToPx()` で Canvas ピクセルへ変換する。

### テンプレート (データ駆動)

`Template` × `AspectKey` ("16:9" / "4:5" / "1:1") で解決する。各テンプレートはアスペクト比ごとの `AspectVariant` (ピクセル寸法 + 任意の背景画像パス) を持つ。`src/templates/index.ts` の `TEMPLATES` カタログに定義し、`getTemplate()` で ID 解決、`resolveLayout()` でアスペクト比ごとのレイアウトを取得する。各テンプレートの variant は内部ヘルパー `makeVariants()` で組み立てる。新テンプレート追加は基本この**データを足すだけ**。

### 画像読み込み (`src/image/loadImage.ts`)

`loadDollBitmap()` は `createImageBitmap()` (EXIF orientation 反映) を試み、失敗時 `<img>` にフォールバック。長辺 2000px 超は縮小。`LoadedBitmap` は `close()` を持ち、`useDollList` が unmount 時に object URL の revoke と ImageBitmap の close を行う。背景画像は `loadBackground()` が URL でグローバルにキャッシュし、失敗時は null (単色背景にフォールバック)。

## Conventions

- **完全クライアントサイド**: バックエンド・外部 API 送信なし。画像はサーバーに出さない。
- **アセットパス**: ハードコードした絶対パス (`/assets/...`) は使わない。GitHub Pages では base が変わるため、`import` するか `import.meta.env.BASE_URL` を経由する。さもないと公開時 404 になる。
- **GitHub Pages デプロイ**: `main` への push で `.github/workflows/deploy.yml` が自動デプロイ。CI では `GITHUB_PAGES=true` が立ち、Vite の base がリポジトリ名 (`/generate-doll-list-image/`) になる。ローカルでは `/`。
- **背景テンプレート画像**: Codex の imagegen スキル (組み込み `image_gen` ツール / `codex exec` 経由。`codex imagegen` という CLI サブコマンドは存在しない) で生成し、3 アスペクト比分を `public/templates/<id>-16x9.jpg` (1600×900) / `<id>-4x5.jpg` (1080×1350) / `<id>-1x1.jpg` (1080×1080) に置く。生成は近い向き (横長/縦長/正方) で出力 → mac 標準 `sips` で「幅リサンプル → 中央クロップ」して正確な寸法に正規化 → 装飾背景なので `sips -s format jpeg` で JPEG 化して軽量化 (各 ~数百 KB)。参照拡張子は `makeVariants()` 側 (`.jpg`) と一致させること。グリッドは中央寄せなので、背景は中央を空け縁を装飾する。`backgroundColor` だけでも (画像なしで) 成立する。
