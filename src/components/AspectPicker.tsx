import { ASPECT_KEYS, ASPECT_LABELS, type AspectKey } from "../templates/index.ts";

interface Props {
  selected: AspectKey;
  onSelect: (aspect: AspectKey) => void;
}

export function AspectPicker({ selected, onSelect }: Props) {
  return (
    <div className="picker" role="radiogroup" aria-label="出力アスペクト比">
      {ASPECT_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={key === selected}
          className={`picker__chip${key === selected ? " picker__chip--active" : ""}`}
          onClick={() => onSelect(key)}
        >
          {ASPECT_LABELS[key]}
        </button>
      ))}
    </div>
  );
}
