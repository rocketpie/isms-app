import { ProcessView } from "@/lib/browser/isms/processes";

export function EditorRow(props: {
  value: ProcessView;
  owners: { id: string; name: string }[];
  disabled?: boolean;
  onChange: (draft: ProcessView) => void;
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const { value, owners, disabled, onChange, onSave, onDelete, onCancel } = props;
  return (
    <div className="grid gap-2 md:grid-cols-[1fr,2fr,1fr,auto]">
      <input
        className="border rounded-lg px-3 py-2"
        value={value.name}
        onChange={e => onChange({ ...value, name: e.target.value })}
      />
      <input
        className="border rounded-lg px-3 py-2"
        placeholder="Description (optional)"
        value={value.description ?? ''}
        onChange={e => onChange({ ...value, description: e.target.value })}
      />
      <select
        className="border rounded-lg px-3 py-2"
        value={value.owner?.id ?? ''}
        onChange={e =>
          onChange({
            ...value,
            owner: owners.find(o => o.id === e.target.value) ?? null,
          })
        }
      >
        <option value="">Owner (optional)</option>
        {owners.map(o => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <button
          className="rounded-xl px-3 py-2 border bg-black text-white disabled:opacity-60"
          disabled={disabled || value.name.trim().length === 0}
          onClick={onSave}
        >
          Save
        </button>
        <button
          className="rounded-xl px-3 py-2 border bg-white text-red-600 disabled:opacity-60"
          disabled={disabled}
          onClick={onDelete}
        >
          Delete
        </button>
        <button className="rounded-xl px-3 py-2 border bg-white" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
