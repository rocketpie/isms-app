//app/_hooks/useAssetLinks.ts
//Description: useAssetLinksBase implementations eg. useProcessApplications, useApplicationSystems, etc.
"use client";

import { listLinkedApplications, linkApplication, unlinkApplication } from "@/lib/browser/isms/process-applications";
import { useAssetLinksBase } from "./useAssetLinksBase";
import { useApplications, useConnections, useData, useLocations, useSystems } from "./useAssets";
import { linkSystem, listLinkedSystems, unlinkSystem } from "@/lib/browser/isms/application-systems";
import { listLinkedData, linkData, unlinkData } from "@/lib/browser/isms/system-data";
import { listLinkedLocations, linkLocation, unlinkLocation } from "@/lib/browser/isms/connection-locations";
import { listLinkedConnections, linkConnection, unlinkConnection } from "@/lib/browser/isms/location-connections";

export function useProcessApplications(processId: string) {
  const apps = useApplications();
  return useAssetLinksBase(
    "process",
    processId,
    "application",
    {
      listLinked: listLinkedApplications,
      link: linkApplication,
      unlink: unlinkApplication,
    },
    apps,
  );
}

export function useApplicationSystems(applicationId: string) {
  const systems = useSystems();
  return useAssetLinksBase(
    "application",
    applicationId,
    "system",
    {
      listLinked: listLinkedSystems,
      link: linkSystem,
      unlink: unlinkSystem,
    },
    systems,
  );
}

export function useSystemData(systemId: string) {
  const data = useData();
  return useAssetLinksBase(
    "system",
    systemId,
    "data",
    {
      listLinked: listLinkedData,
      link: linkData,
      unlink: unlinkData,
    },
    data,
  );
}

export function useLocationConnections(locationId: string) {
  const connections = useConnections();
  return useAssetLinksBase(
    "location",
    locationId,
    "connection",
    {
      listLinked: listLinkedConnections,
      link: linkConnection,
      unlink: unlinkConnection,
    },
    connections,
  );
}


export function useConnectionLocations(connectionId: string) {
  const locations = useLocations();
  return useAssetLinksBase(
    "connection",
    connectionId,
    "location",
    {
      listLinked: listLinkedLocations,
      link: linkLocation,
      unlink: unlinkLocation,
    },
    locations,
  );
}
