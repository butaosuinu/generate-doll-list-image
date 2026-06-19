import { useCallback, useEffect, useRef, useState } from "react";
import { loadDollBitmap, type LoadedBitmap } from "../image/loadImage.ts";

export const MAX_DOLLS = 24;

export interface Doll {
  id: string;
  name: string;
  /** サムネイル <img> 用の object URL。 */
  thumbUrl: string;
  /** Canvas 合成用の読み込み済み画像。 */
  image: LoadedBitmap;
  focusX: number;
  focusY: number;
}

function disposeDoll(doll: Doll): void {
  doll.image.close();
  URL.revokeObjectURL(doll.thumbUrl);
}

function fileBaseName(file: File): string {
  return file.name.replace(/\.[^.]+$/, "");
}

export interface UseDollList {
  dolls: Doll[];
  loading: boolean;
  addFiles: (files: FileList | File[]) => Promise<{ added: number; skipped: number }>;
  remove: (id: string) => void;
  rename: (id: string, name: string) => void;
  move: (id: string, delta: -1 | 1) => void;
  clear: () => void;
}

export function useDollList(): UseDollList {
  const [dolls, setDolls] = useState<Doll[]>([]);
  const [loading, setLoading] = useState(false);

  // 最新の dolls を unmount 時のクリーンアップで参照するための ref
  const dollsRef = useRef<Doll[]>([]);
  dollsRef.current = dolls;

  useEffect(() => {
    return () => {
      for (const d of dollsRef.current) disposeDoll(d);
    };
  }, []);

  const addFiles = useCallback<UseDollList["addFiles"]>(async (input) => {
    const files = Array.from(input).filter((f) => f.type.startsWith("image/"));
    const remaining = MAX_DOLLS - dollsRef.current.length;
    const accepted = files.slice(0, Math.max(0, remaining));
    const skipped = files.length - accepted.length;
    if (accepted.length === 0) return { added: 0, skipped };

    setLoading(true);
    try {
      const loaded: Doll[] = [];
      for (const file of accepted) {
        try {
          const image = await loadDollBitmap(file);
          loaded.push({
            id: crypto.randomUUID(),
            name: fileBaseName(file),
            thumbUrl: URL.createObjectURL(file),
            image,
            focusX: 0.5,
            focusY: 0.5,
          });
        } catch {
          // 読み込めない画像はスキップ
        }
      }
      if (loaded.length > 0) setDolls((prev) => [...prev, ...loaded]);
      return { added: loaded.length, skipped: skipped + (accepted.length - loaded.length) };
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback<UseDollList["remove"]>((id) => {
    setDolls((prev) => {
      const target = prev.find((d) => d.id === id);
      if (target) disposeDoll(target);
      return prev.filter((d) => d.id !== id);
    });
  }, []);

  const rename = useCallback<UseDollList["rename"]>((id, name) => {
    setDolls((prev) => prev.map((d) => (d.id === id ? { ...d, name } : d)));
  }, []);

  const move = useCallback<UseDollList["move"]>((id, delta) => {
    setDolls((prev) => {
      const i = prev.findIndex((d) => d.id === id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }, []);

  const clear = useCallback<UseDollList["clear"]>(() => {
    setDolls((prev) => {
      for (const d of prev) disposeDoll(d);
      return [];
    });
  }, []);

  return { dolls, loading, addFiles, remove, rename, move, clear };
}
