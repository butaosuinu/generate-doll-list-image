/** Blob を一時 <a download> でダウンロードさせる。 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // クリック直後に revoke するとダウンロードが中断される環境があるため遅延
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** doll-list-YYYYMMDD-HHmm.ext 形式のファイル名を生成。 */
export function timestampName(prefix: string, ext: string): string {
  const d = new Date();
  const date = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}${pad(d.getMinutes())}`;
  return `${prefix}-${date}-${time}.${ext}`;
}
