import type { Doll } from "../state/useDollList.ts";

interface Props {
  dolls: Doll[];
  onRename: (id: string, name: string) => void;
  onMove: (id: string, delta: -1 | 1) => void;
  onRemove: (id: string) => void;
}

export function DollListEditor({ dolls, onRename, onMove, onRemove }: Props) {
  if (dolls.length === 0) {
    return <p className="editor__empty">まだ写真がありません。</p>;
  }

  return (
    <ul className="editor">
      {dolls.map((doll, index) => (
        <li key={doll.id} className="editor__item">
          <img className="editor__thumb" src={doll.thumbUrl} alt="" />
          <input
            className="editor__name"
            type="text"
            value={doll.name}
            placeholder="名前"
            aria-label={`${index + 1} 体目の名前`}
            maxLength={40}
            onChange={(e) => onRename(doll.id, e.target.value)}
          />
          <div className="editor__actions">
            <button
              type="button"
              aria-label="上へ移動"
              disabled={index === 0}
              onClick={() => onMove(doll.id, -1)}
            >
              ↑
            </button>
            <button
              type="button"
              aria-label="下へ移動"
              disabled={index === dolls.length - 1}
              onClick={() => onMove(doll.id, 1)}
            >
              ↓
            </button>
            <button
              type="button"
              className="editor__remove"
              aria-label="削除"
              onClick={() => onRemove(doll.id)}
            >
              ✕
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
