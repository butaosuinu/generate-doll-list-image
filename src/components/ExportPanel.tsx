import { useMemo, useState } from "react";
import type { OutputFormat } from "../compose/composeImage.ts";
import { downloadBlob, timestampName } from "../image/download.ts";
import { isShareFilesSupported, openTweetIntent, shareImageFile } from "../share/tweetIntent.ts";

interface Props {
  disabled: boolean;
  compose: (format: OutputFormat) => Promise<Blob>;
}

const HASHTAGS = ["ドール一覧画像メーカー"];

function fileFor(blob: Blob, format: OutputFormat): File {
  const name = timestampName("doll-list", format === "png" ? "png" : "jpg");
  return new File([blob], name, { type: blob.type });
}

export function ExportPanel({ disabled, compose }: Props) {
  const [format, setFormat] = useState<OutputFormat>("jpeg");
  const [tweetText, setTweetText] = useState("ドール一覧を作りました！");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canShareFiles = useMemo(
    () => isShareFilesSupported(new File([], "probe.png", { type: "image/png" })),
    [],
  );

  const run = async (task: (blob: Blob, file: File) => void | Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      const blob = await compose(format);
      await task(blob, fileFor(blob, format));
    } catch (err) {
      setError(err instanceof Error ? err.message : "画像の生成に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = () => run((blob, file) => downloadBlob(blob, file.name));

  const handleShare = () =>
    run(async (_blob, file) => {
      const ok = await shareImageFile(file, tweetText);
      if (!ok) openTweetIntent(tweetText, HASHTAGS);
    });

  return (
    <div className="export">
      <fieldset className="export__format">
        <legend>形式</legend>
        <label>
          <input
            type="radio"
            name="format"
            checked={format === "jpeg"}
            onChange={() => setFormat("jpeg")}
          />
          JPEG（軽量・写真向き）
        </label>
        <label>
          <input
            type="radio"
            name="format"
            checked={format === "png"}
            onChange={() => setFormat("png")}
          />
          PNG（高画質）
        </label>
      </fieldset>

      <label className="export__field">
        投稿本文（任意）
        <textarea
          rows={2}
          value={tweetText}
          onChange={(e) => setTweetText(e.target.value)}
          placeholder="X に添える本文"
        />
      </label>

      <div className="export__buttons">
        <button
          type="button"
          className="export__primary"
          disabled={disabled || busy}
          onClick={handleDownload}
        >
          {busy ? "生成中…" : "画像をダウンロード"}
        </button>
        {canShareFiles ? (
          <button type="button" disabled={disabled || busy} onClick={handleShare}>
            画像を共有 / X へ
          </button>
        ) : (
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => openTweetIntent(tweetText, HASHTAGS)}
          >
            X の投稿画面を開く
          </button>
        )}
      </div>

      {error && <p className="export__error">{error}</p>}

      {!canShareFiles && (
        <ol className="export__guide">
          <li>「画像をダウンロード」で保存</li>
          <li>「X の投稿画面を開く」で本文を準備</li>
          <li>保存した画像を手動で添付して投稿</li>
        </ol>
      )}
    </div>
  );
}
