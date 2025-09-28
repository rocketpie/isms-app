//app/processes/components/SystemEditorRow.tsx
'use client'

import { OwnershipView } from "@/lib/browser/isms/ownership";
import { SystemView } from "@/lib/browser/isms/systems";

export function SystemEditorRow(props: {
  value: SystemView;
  owners: OwnershipView[];
  disabled?: boolean;
  onChange: (draft: SystemView) => void;
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const { value, owners, disabled, onChange, onSave, onDelete, onCancel } = props;
  return (
    <div className="grid gap-2 md:grid-cols-[1fr,2fr,1fr,auto]">
      <input
        className="border rounded-lg px-3 py-2"
        placeholder="Name"
        value={value.name}
        onChange={e => onChange({ ...value, name: e.target.value })}
        disabled={disabled}
      />
      <input
        className="border rounded-lg px-3 py-2"
        placeholder="Description"
        value={value.description ?? ''}
        onChange={e => onChange({ ...value, description: e.target.value })}
        disabled={disabled}
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
        disabled={disabled}
      >
        <option value="">No owner</option>
        {owners.map(o => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      
      <div className="flex gap-2">
        <button
          className="rounded-xl px-3 py-2 border bg-black text-white disabled:opacity-60"
          onClick={onSave}
          disabled={disabled || value.name.trim().length === 0}
        >
          Save
        </button>
        <button
          className="rounded-xl px-3 py-2 border bg-white text-red-600 disabled:opacity-60"
          onClick={onDelete}
          disabled={disabled}
        >
          Delete
        </button>
        <button
          className="rounded-xl px-3 py-2 border bg-white"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
