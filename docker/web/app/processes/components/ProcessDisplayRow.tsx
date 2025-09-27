//app/processes/components/ProcessDisplayRow.tsx
 
import { ProcessView } from "@/lib/browser/isms/processes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronRight } from "@fortawesome/free-solid-svg-icons";


export function DisplayRow(props: {
  item: ProcessView;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const { item, expanded, onToggle, onEdit } = props;
  return (
    <div className="grid gap-1 grid-cols-1 md:grid-cols-[auto,1fr,2fr,1fr,auto] md:items-center">
      <button className="text-lg text-neutral-500 hover:text-black" onClick={onToggle}>
        <FontAwesomeIcon icon={expanded ? faChevronDown : faChevronRight} className="w-4 h-4" />
      </button>

      <button className="font-medium text-left" onClick={onToggle}>
        {item.name}
      </button>

      <div className="text-sm text-neutral-700">
        {item.description ? (
          <span className="text-neutral-600">{item.description}</span>
        ) : (
          <span className="text-neutral-400">No description</span>
        )}
      </div>

      <div className="text-sm text-neutral-700">
        Owner: <span className="text-neutral-600">{item.owner?.name}</span>
      </div>

      <div className="flex gap-2">
        <button className="rounded-xl px-3 py-2 border bg-white" onClick={onEdit}>
          Edit
        </button>
      </div>
    </div>
  );
}
