/** X の投稿画面を本文・ハッシュタグ付きで開く（画像は別途手動添付）。 */
export function openTweetIntent(text: string, hashtags: string[] = []): void {
  const url = new URL("https://twitter.com/intent/tweet");
  if (text.trim()) url.searchParams.set("text", text.trim());
  const tags = hashtags.map((t) => t.replace(/^#/, "").trim()).filter(Boolean);
  if (tags.length) url.searchParams.set("hashtags", tags.join(","));
  window.open(url.toString(), "_blank", "noopener,noreferrer");
}

/**
 * Web Share API で画像ごと共有を試みる。
 * 対応端末（多くはモバイル）では true、非対応なら false を返し呼び出し側がフォールバックする。
 */
export async function shareImageFile(file: File, text: string): Promise<boolean> {
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };
  const data: ShareData = { files: [file], text };
  if (!nav.share || !nav.canShare || !nav.canShare(data)) return false;
  try {
    await nav.share(data);
    return true;
  } catch (err) {
    // ユーザーがキャンセルした場合も false（フォールバックは呼ばない想定で呼び出し側が判断）
    if (err instanceof DOMException && err.name === "AbortError") return true;
    return false;
  }
}

export function isShareFilesSupported(file: File): boolean {
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  return typeof nav.canShare === "function" && nav.canShare({ files: [file] });
}
