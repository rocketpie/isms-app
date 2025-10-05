"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddAssets } from "../AddAssets";

export type AssetNames = {
  personName: string;
  teamName: string;
  processName: string;
  applicationName: string;
  systemName: string;
  locationName: string;
  dataName: string;
  dataCategoryName: string;
  connectionName: string;
};

const PRESETS: Record<string, AssetNames> = {
  "Billing / CRM / Salesforce": {
    personName: "Alice Adams",
    teamName: "Billing Team",
    processName: "Billing",
    applicationName: "CRM",
    systemName: "Salesforce",
    locationName: "AWS Cloud",
    dataName: "Customers",
    connectionName: "CRM->Billing Feed",
    dataCategoryName: "Customer Master",
  },
  "App Operation / Image App / webserver": {
    personName: "Bob Brown",
    teamName: "Ops Team",
    processName: "App Operation",
    applicationName: "Image App",
    systemName: "webserver",
    locationName: "Datacenter",
    dataName: "pictures",
    connectionName: "Web Upload",
    dataCategoryName: "Media",
  },
   "Development / Visual Studio / Workstation": {
    personName: "Dave Developer",
    teamName: "Dev Team",
    processName: "App development",
    applicationName: "Visual Studio",
    systemName: "Workstation",
    locationName: "Office",
    dataName: "source code",
    dataCategoryName: "Company Knolwledge",
    connectionName: "VPN",
  },
};

type RowProps = {
  id: keyof AssetNames;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
};

const FieldRow = React.memo(function FieldRow({
  id,
  label,
  value,
  onChange,
  placeholder,
}: RowProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={String(id)}>{label}</Label>
      <Input
        id={String(id)}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
});

export default function TestDataForm() {
  const [fields, setFields] = React.useState<AssetNames>({
    personName: "",
    teamName: "",
    processName: "",
    applicationName: "",
    systemName: "",
    locationName: "",
    dataName: "",
    dataCategoryName: "",
    connectionName: "",
  });
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const applyPreset = (key: string) => {
    const preset = PRESETS[key];
    setFields((f) => ({ ...f, ...preset }));
  };

  const onChange =
    (key: keyof AssetNames) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setFields((f) => ({ ...f, [key]: e.target.value }));
      };

  const onAdd = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      await AddAssets(fields);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  const Row = ({
    id,
    label,
    placeholder,
  }: {
    id: keyof AssetNames;
    label: string;
    placeholder?: string;
  }) => (
    <div className="grid gap-1.5">
      <Label htmlFor={String(id)}>{label}</Label>
      <Input
        id={String(id)}
        value={fields[id]}
        onChange={onChange(id)}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="mt-4 space-y-6">
      {/* Presets */}
      <div className="space-y-2">
        <Label className="text-sm">Presets</Label>
        <div className="flex flex-wrap gap-2">
          {Object.keys(PRESETS).map((k) => (
            <Button
              key={k}
              variant="secondary"
              type="button"
              onClick={() => applyPreset(k)}
            >
              {k}
            </Button>
          ))}
        </div>
      </div>

      {/* Form grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow id="personName" label="Person Name" value={fields.personName} onChange={onChange("personName")} placeholder="e.g., Alice Adams" />
        <FieldRow id="teamName" label="Team Name" value={fields.teamName} onChange={onChange("teamName")} placeholder="e.g., Billing Team" />

        <FieldRow id="processName" label="Process Name" value={fields.processName} onChange={onChange("processName")} placeholder="e.g., Billing" />
        <FieldRow id="applicationName" label="Application Name" value={fields.applicationName} onChange={onChange("applicationName")} placeholder="e.g., CRM" />

        <FieldRow id="systemName" label="System Name" value={fields.systemName} onChange={onChange("systemName")} placeholder="e.g., Salesforce" />
        <FieldRow id="locationName" label="Location Name" value={fields.locationName} onChange={onChange("locationName")} placeholder="e.g., AWS Cloud" />

        <FieldRow id="dataName" label="Data Name" value={fields.dataName} onChange={onChange("dataName")} placeholder="e.g., Customers" />
        <FieldRow id="dataCategoryName" label="Category Name" value={fields.dataCategoryName} onChange={onChange("dataCategoryName")} placeholder="(not persisted yet)" />

        <div className="md:col-span-2">
          <FieldRow id="connectionName" label="Connection Name" value={fields.connectionName} onChange={onChange("connectionName")} placeholder="e.g., CRM->Billing Feed" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button onClick={onAdd} disabled={busy}>
          {busy ? "Adding…" : "Add"}
        </Button>
        <span className="text-xs text-muted-foreground">
          Requires an authenticated user with <code>app_role=editor</code>.
        </span>
      </div>

      {result && (
        <pre className="text-sm whitespace-pre-wrap border rounded p-3">{result}</pre>
      )}
      {error && (
        <pre className="text-sm whitespace-pre-wrap border border-red-500 rounded p-3">
          Error: {error}
        </pre>
      )}
    </div>
  );
}
