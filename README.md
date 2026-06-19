# ドール一覧画像メーカー

ドールの写真と名前を複数入力すると、X（旧Twitter）投稿向けの「ドール一覧」を1枚の画像に合成できる、**フロントエンドのみ**の Web ツールです。画像はすべてブラウザ内で処理され、サーバーには送信されません。

## 特長

- 写真＋名前を並べて1枚の一覧画像に合成（自動グリッド配置・最大 24 体）
- 複数の背景テンプレートを切り替え
- 出力アスペクト比を **16:9 / 4:5 / 1:1** から選択
- JPEG / PNG で書き出し → ダウンロード or Web Share（モバイル）/ X 投稿画面
- サーバーレス。GitHub Pages にデプロイ可能

## 開発

パッケージマネージャは **pnpm**（`packageManager` フィールドで `pnpm@11.6.0` に固定。corepack 経由で自動取得）。

```bash
corepack enable      # 初回のみ（pnpm を有効化）
pnpm install
pnpm run dev          # 開発サーバー
pnpm run build        # 型チェック + 本番ビルド (dist/)
pnpm run preview      # 本番ビルドのプレビュー
pnpm run test         # Vitest（合成ロジックの単体テスト）
pnpm run lint         # oxlint
pnpm run format       # oxfmt（整形して上書き）
pnpm run format:check # oxfmt --check（整形差分の確認のみ）
```

リンタは [oxlint](https://oxc.rs/)、フォーマッタは oxfmt を使用します（設定は `.oxlintrc.json` / `.oxfmtrc.json`）。

## デプロイ（GitHub Pages）

`.github/workflows/deploy.yml` が main への push で自動デプロイします。

1. リポジトリの **Settings → Pages → Source** を **GitHub Actions** に設定
2. main に push すると Actions がビルドして公開
3. 公開 URL: `https://<user>.github.io/generate-doll-list-image/`

`vite.config.ts` の `base` は CI 環境変数 `GITHUB_PAGES` が真のときのみリポジトリ名になります。アセットは必ず `import` か `import.meta.env.BASE_URL` 経由で参照してください（絶対パスのハードコードは base ズレで 404 になります）。

## 背景テンプレート画像の追加

テンプレートは背景画像が無くても `backgroundColor` で動作します。凝った背景を使う場合は、codex imagegen 等で各アスペクト比の画像を生成し、以下のパスに配置してください（`src/templates/index.ts` の `makeVariants` 参照）。

```
public/templates/<id>-16x9.png   # 1600 x 900
public/templates/<id>-4x5.png    # 1080 x 1350
public/templates/<id>-1x1.png    # 1080 x 1080
```

例: `pastel` テンプレートなら `pastel-16x9.png` / `pastel-4x5.png` / `pastel-1x1.png`。
グリッドは画像中央付近に置かれるため、背景は周縁を装飾し中央を控えめにしたデザインが向いています。

## 構成

- `src/compose/` — フレームワーク非依存の合成コア（`composeImage` / `coverRect` / `layout` / `drawText`）
- `src/templates/` — テンプレート型定義とデータ
- `src/components/` — UI（入力・プレビュー・選択・出力）
- `src/state/useDollList.ts` — ドールリストの状態管理
- `src/image/` — 画像読み込み（EXIF 回転・縮小）とダウンロード
- `src/share/` — X 投稿 Intent / Web Share
