interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  /** ラジオグループのラベル（スクリーンリーダー向け）。 */
  ariaLabel: string;
  options: readonly Option<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

/** AspectPicker と同じ .picker / .picker__chip を使う汎用の 2 択以上セグメント。 */
export function SegmentedPicker<T extends string>({
  ariaLabel,
  options,
  selected,
  onSelect,
}: Props<T>) {
  return (
    <div className="picker" role="radiogroup" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={opt.value === selected}
          className={`picker__chip${opt.value === selected ? " picker__chip--active" : ""}`}
          onClick={() => onSelect(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
