import type { LoadedImage } from "../compose/composeImage.ts";

/** ドール写真の最大保持辺。出力は最大 1600px 幅なので 2000px もあれば十分。 */
const MAX_EDGE = 2000;

export interface LoadedBitmap extends LoadedImage {
  /** ImageBitmap のメモリを解放する（HTMLImageElement フォールバック時は no-op）。 */
  close(): void;
}

function fitWithin(w: number, h: number, maxEdge: number): { width: number; height: number } {
  const longest = Math.max(w, h);
  if (longest <= maxEdge) return { width: w, height: h };
  const scale = maxEdge / longest;
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

/**
 * ドール写真を読み込む。createImageBitmap で EXIF 回転を反映しつつ
 * 大きすぎる画像は縮小して保持する。非対応環境では <img> にフォールバック。
 */
export async function loadDollBitmap(file: File): Promise<LoadedBitmap> {
  if (typeof createImageBitmap === "function") {
    try {
      const probe = await createImageBitmap(file, { imageOrientation: "from-image" });
      const target = fitWithin(probe.width, probe.height, MAX_EDGE);
      if (target.width >= probe.width) {
        return {
          source: probe,
          width: probe.width,
          height: probe.height,
          close: () => probe.close(),
        };
      }
      const resized = await createImageBitmap(probe, 0, 0, probe.width, probe.height, {
        resizeWidth: target.width,
        resizeHeight: target.height,
        resizeQuality: "high",
      });
      probe.close();
      return {
        source: resized,
        width: target.width,
        height: target.height,
        close: () => resized.close(),
      };
    } catch {
      // 古い Safari 等で createImageBitmap(File) が失敗する場合がある
    }
  }
  return loadViaImageElement(file);
}

function loadViaImageElement(file: File): Promise<LoadedBitmap> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        source: img,
        width: img.naturalWidth,
        height: img.naturalHeight,
        close: () => URL.revokeObjectURL(url),
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("画像を読み込めませんでした"));
    };
    img.src = url;
  });
}

const backgroundCache = new Map<string, Promise<LoadedImage | null>>();

/** テンプレ背景画像を読み込んでキャッシュする。失敗時は null（背景色フォールバック）。 */
export function loadBackground(path: string): Promise<LoadedImage | null> {
  const url = `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
  const cached = backgroundCache.get(url);
  if (cached) return cached;

  const promise = new Promise<LoadedImage | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ source: img, width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = url;
  });
  backgroundCache.set(url, promise);
  return promise;
}
