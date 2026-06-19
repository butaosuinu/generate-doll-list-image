import { useRef, useState } from "react";

interface Props {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  hint?: string;
}

export function DropZone({ onFiles, disabled = false, hint }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handlePick = (list: FileList | null) => {
    if (!list) return;
    onFiles(Array.from(list));
  };

  return (
    <div
      className={`dropzone${dragOver ? " dropzone--over" : ""}${disabled ? " dropzone--disabled" : ""}`}
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (disabled) return;
        handlePick(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        disabled={disabled}
        onChange={(e) => {
          handlePick(e.target.files);
          e.target.value = ""; // 同じファイルを連続選択できるようリセット
        }}
      />
      <button
        type="button"
        className="dropzone__button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        写真を選ぶ
      </button>
      <p className="dropzone__text">
        {disabled ? "上限に達しました" : "ここに画像をドラッグ＆ドロップ、または上のボタンから選択"}
      </p>
      {hint && <p className="dropzone__hint">{hint}</p>}
    </div>
  );
}
