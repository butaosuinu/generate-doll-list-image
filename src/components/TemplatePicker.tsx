import { TEMPLATES } from "../templates/index.ts";

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function TemplatePicker({ selectedId, onSelect }: Props) {
  return (
    <div className="picker" role="radiogroup" aria-label="背景テンプレート">
      {TEMPLATES.map((t) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={t.id === selectedId}
          className={`picker__chip${t.id === selectedId ? " picker__chip--active" : ""}`}
          style={{ background: t.backgroundColor, color: t.defaultTextStyle.color }}
          onClick={() => onSelect(t.id)}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}
