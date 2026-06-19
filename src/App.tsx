import { useEffect, useMemo, useState } from "react";
import { DEFAULT_TEMPLATE_ID, getTemplate, type AspectKey } from "./templates/index.ts";
import {
  composeToBlob,
  type DollImage,
  type LoadedImage,
  type OutputFormat,
} from "./compose/composeImage.ts";
import { loadBackground } from "./image/loadImage.ts";
import { MAX_DOLLS, useDollList } from "./state/useDollList.ts";
import { DropZone } from "./components/DropZone.tsx";
import { DollListEditor } from "./components/DollListEditor.tsx";
import { TemplatePicker } from "./components/TemplatePicker.tsx";
import { AspectPicker } from "./components/AspectPicker.tsx";
import { PreviewCanvas } from "./components/PreviewCanvas.tsx";
import { ExportPanel } from "./components/ExportPanel.tsx";
import { PrivacyNote } from "./components/PrivacyNote.tsx";

export default function App() {
  const { dolls, loading, addFiles, remove, rename, move, clear } = useDollList();
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const [aspect, setAspect] = useState<AspectKey>("16:9");
  const [title, setTitle] = useState("");
  const [background, setBackground] = useState<LoadedImage | null>(null);

  const template = useMemo(() => getTemplate(templateId), [templateId]);
  const titleText = title.trim() || template.title?.defaultText || "";

  // テンプレ／アスペクト変更時に背景を読み込む
  useEffect(() => {
    let alive = true;
    const path = template.variants[aspect].background;
    setBackground(null);
    if (path) {
      loadBackground(path).then((bg) => {
        if (alive) setBackground(bg);
      });
    }
    return () => {
      alive = false;
    };
  }, [template, aspect]);

  const dollImages: DollImage[] = useMemo(
    () =>
      dolls.map((d) => ({
        source: d.image.source,
        width: d.image.width,
        height: d.image.height,
        name: d.name,
        focusX: d.focusX,
        focusY: d.focusY,
      })),
    [dolls],
  );

  const compose = async (format: OutputFormat): Promise<Blob> => {
    // 初回描画でフォールバックフォントにならないよう読み込み完了を待つ
    if (document.fonts?.ready) await document.fonts.ready;
    const path = template.variants[aspect].background;
    const bg = path ? await loadBackground(path) : null;
    return composeToBlob(
      { template, aspect, dolls: dollImages, title: titleText, background: bg },
      format,
    );
  };

  return (
    <div className="app">
      <header className="app__header">
        <h1>ドール一覧画像メーカー</h1>
        <p className="app__sub">写真と名前を並べて、X 投稿用の一覧画像を1枚に。</p>
        <PrivacyNote />
      </header>

      <main className="app__main">
        <section className="panel" aria-label="写真の追加と編集">
          <h2 className="panel__title">写真</h2>
          <DropZone
            onFiles={addFiles}
            disabled={dolls.length >= MAX_DOLLS}
            hint={`${dolls.length} / ${MAX_DOLLS} 体`}
          />
          {loading && <p className="panel__note">読み込み中…</p>}
          <DollListEditor dolls={dolls} onRename={rename} onMove={move} onRemove={remove} />
          {dolls.length > 0 && (
            <button type="button" className="panel__clear" onClick={clear}>
              すべて削除
            </button>
          )}
        </section>

        <section className="panel" aria-label="デザインと出力">
          <h2 className="panel__title">デザイン</h2>

          <label className="panel__label">テンプレート</label>
          <TemplatePicker selectedId={templateId} onSelect={setTemplateId} />

          <label className="panel__label">アスペクト比</label>
          <AspectPicker selected={aspect} onSelect={setAspect} />

          {template.title?.editable && (
            <label className="panel__field">
              タイトル
              <input
                type="text"
                value={title}
                placeholder={template.title.defaultText ?? ""}
                maxLength={30}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
          )}

          <PreviewCanvas
            template={template}
            aspect={aspect}
            dolls={dollImages}
            title={titleText}
            background={background}
          />

          <h2 className="panel__title">出力</h2>
          <ExportPanel disabled={dolls.length === 0} compose={compose} />
        </section>
      </main>

      <footer className="app__footer">
        <p>画像はブラウザ内で生成。X への投稿は画像を保存してから添付してください。</p>
      </footer>
    </div>
  );
}
