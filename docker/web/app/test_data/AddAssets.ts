//app/test_data/AddAssets.ts
//Description: React function to add a set of related assets
"use client";

import { createPerson } from "@/lib/browser/isms/people";
import { createOwnership } from "@/lib/browser/isms/ownership";
import { ApplicationView, ConnectionView, DataAssetView, DataCategoryView, LocationView, OwnershipView, PersonView, ProcessView, SystemView } from "@/lib/browser/isms/assetTypes";
import { createLocation } from "@/lib/browser/isms/locations";
import { createConnection } from "@/lib/browser/isms/connections";
import { createDataCategory } from "@/lib/browser/isms/dataCategories";
import { createData } from "@/lib/browser/isms/dataAssets";
import { createSystem } from "@/lib/browser/isms/systems";
import { linkData } from "@/lib/browser/isms/system-data";
import { linkConnection } from "@/lib/browser/isms/location-connections";
import { createApplication } from "@/lib/browser/isms/applications";
import { createProcess } from "@/lib/browser/isms/processes";
import { linkSystem } from "@/lib/browser/isms/application-systems";
import { linkApplication } from "@/lib/browser/isms/process-applications";
import { AssetNames } from "./_components/TestDataForm";


export type AddAssetsResult = {
  person: PersonView | null;
  owner: OwnershipView | null;
  location: LocationView | null;
  connection: ConnectionView | null;
  category: DataCategoryView | null;
  data: DataAssetView | null;
  system: SystemView | null;
  application: ApplicationView | null;
  process: ProcessView | null;
  notes: string[];
};

/**
 * React hook returning a single `addAssets` function that:
 * create person → team(ownership) → location → connection
 * → (optional) category → data → system → links (system↔data, system↔location, location↔connection)
 * → application → link (application↔system) → process → link (process↔application)
 */
export async function AddAssets(input: AssetNames): Promise<AddAssetsResult> {
  let result: AddAssetsResult = {
    person: null,
    owner: null,
    location: null,
    connection: null,
    category: null,
    data: null,
    system: null,
    application: null,
    process: null,
    notes: [],
  };

  // 1) create person
  const personId = await createPerson({
    id: "",
    name: input.personName.trim(),
    description: "",
  })
  result.person = personId ? { id: personId, name: input.personName.trim(), description: null } : null;

  // 2) create team (ownership) with primary_person_id
  const ownerId = await createOwnership({
    id: "",
    name: input.teamName.trim(),
    primary: result.person,
    deputy: null,
  });
  result.owner = ownerId ? { id: ownerId, name: input.teamName.trim(), primary: result.person, deputy: null } : null;

  // 3) create location (owner_id)
  const locationId = await createLocation({
    id: "",
    name: input.locationName.trim(),
    description: "",
    owner: result.owner
  });
  result.location = locationId ? { id: locationId, name: input.locationName.trim(), description: null, owner: result.owner } : null;

  // 4) create connection (owner_id)  — location association is via junction below
  const connectionId = await createConnection({
    id: "",
    name: input.connectionName.trim(),
    description: "",
    owner: result.owner
  });
  result.connection = connectionId ? { id: connectionId, name: input.connectionName.trim(), description: null, owner: result.owner } : null;

  // 5) create dataCategory (optional; only if your table exists)
  const categoryId = await createDataCategory({
    id: "",
    name: input.dataCategoryName.trim(),
    description: ""
  });
  result.category = categoryId ? { id: categoryId, name: input.dataCategoryName.trim(), description: null } : null;

  // 6) create data (owner_id, optional category_id)
  const dataId = await createData({
    id: "",
    name: input.dataName.trim(),
    description: "",
    owner: result.owner,
    category: result.category,
  });
  result.data = dataId ? { id: dataId, name: input.dataName.trim(), description: null, owner: result.owner, category: result.category } : null;

  // 7) create system (owner_id)  — location association is via system_locations junction
  const systemId = await createSystem({
    id: "",
    name: input.systemName.trim(),
    description: "",
    owner: result.owner,
    location: result.location,
  });
  result.system = systemId ? { id: systemId, name: input.systemName.trim(), description: null, owner: result.owner, location: result.location } : null;

  // 8) create application (owner_id)
  const applicationId = await createApplication({
    id: "",
    name: input.applicationName.trim(),
    description: "",
    owner: result.owner
  });
  result.application = applicationId ? { id: applicationId, name: input.applicationName.trim(), description: null, owner: result.owner } : null;

  // 9) create process (owner_id)
  const processId = await createProcess({
    id: "",
    name: input.processName.trim(),
    description: "",
    owner: result.owner
  });
  result.process = processId ? { id: processId, name: input.processName.trim(), description: null, owner: result.owner } : null;

  // 10) link system -> data
  if (result.system?.id && result.data?.id) {
    await linkData(result.system.id, result.data.id);
  }

  // And link location -> connection
  if (result.location?.id && result.connection?.id) {
    await linkConnection(result.location.id, result.connection.id);
  }

  // 10) link application -> system
  if (result.application?.id && result.system?.id) {
    await linkSystem(result.application.id, result.system.id);
  }

  // 12) link process -> application
  if (result.process?.id && result.application?.id) {
    linkApplication(result.process.id, result.application.id);
  }

  return result;
}
