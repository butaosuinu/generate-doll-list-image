import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// GitHub Pages のプロジェクトページ https://<user>.github.io/generate-doll-list-image/
// で配信するため、CI 時のみ base をリポジトリ名にする。ローカルは "/"。
// アセットは必ず import か import.meta.env.BASE_URL 経由で参照すること
// （"/assets/..." の絶対パスをハードコードすると base ズレで 404 になる）。
export default defineConfig({
  base: process.env.GITHUB_PAGES ? "/generate-doll-list-image/" : "/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
  },
});
