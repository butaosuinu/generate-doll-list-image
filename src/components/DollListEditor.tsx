import type { Doll } from "../state/useDollList.ts";
import { FocusThumb } from "./FocusThumb.tsx";

interface Props {
  dolls: Doll[];
  onRename: (id: string, name: string) => void;
  onEditNote: (id: string, note: string) => void;
  onSetFocus: (id: string, focusX: number, focusY: number) => void;
  onMove: (id: string, delta: -1 | 1) => void;
  onRemove: (id: string) => void;
}

export function DollListEditor({
  dolls,
  onRename,
  onEditNote,
  onSetFocus,
  onMove,
  onRemove,
}: Props) {
  if (dolls.length === 0) {
    return <p className="editor__empty">まだ写真がありません。</p>;
  }

  return (
    <ul className="editor">
      {dolls.map((doll, index) => (
        <li key={doll.id} className="editor__item">
          <FocusThumb
            src={doll.thumbUrl}
            width={doll.image.width}
            height={doll.image.height}
            focusX={doll.focusX}
            focusY={doll.focusY}
            label={`${index + 1} 体目`}
            onChange={(fx, fy) => onSetFocus(doll.id, fx, fy)}
          />
          <div className="editor__fields">
            <input
              className="editor__name"
              type="text"
              value={doll.name}
              placeholder="名前"
              aria-label={`${index + 1} 体目の名前`}
              maxLength={40}
              onChange={(e) => onRename(doll.id, e.target.value)}
            />
            <textarea
              className="editor__note"
              value={doll.note}
              placeholder="補足（型番・作家名・誕生日など 改行可）"
              aria-label={`${index + 1} 体目の補足`}
              rows={2}
              maxLength={120}
              onChange={(e) => onEditNote(doll.id, e.target.value)}
            />
          </div>
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
