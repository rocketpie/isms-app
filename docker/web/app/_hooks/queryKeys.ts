//app/_hooks/queryKeys.ts

import { QueryKey } from "@tanstack/react-query";

// on change, update kb-5012-nextjs-app-isms-pages.md!
export const queryKeys = {
  allPeople: ["people", "all"] as const,
  allOwnership: ["ownership", "all"] as const,
  allProcesses: ["processes", "all"] as const,
  allApplications: ["applications", "all"] as const,
  allSystems: ["systems", "all"] as const,
  allLocations: ["locations", "all"] as const,
  allData: ["data", "all"] as const,
  allConnections: ["connections", "all"] as const,
  processApplications: (processId: string) =>
    ["processApplications", processId] as const,
  applicationSystems: (applicationId: string) =>
    ["applicationSystems", applicationId] as const,
  systemData: (systemId: string) =>
    ["systemData", systemId] as const,
  locationConnections: (locationId: string) =>
    ["locationConnections", locationId] as const,
  connectionLocations: (connectionId: string) =>
    ["connectionLocations", connectionId] as const,

  // helpers to be able to hit every processApplications(processId) cache without knowing processId:
  isProcessApplicationsKey: (key: QueryKey) =>
    Array.isArray(key) && key[0] === "processApplications",
  isApplicationSystemsKey: (key: QueryKey) =>
    Array.isArray(key) && key[0] === "applicationSystems",
  isSystemDataKey: (key: QueryKey) =>
    Array.isArray(key) && key[0] === "systemData",
  isLocationConnectionsKey: (key: QueryKey) =>
    Array.isArray(key) && key[0] === "locationConnections",
  isConnectionLocationsKey: (key: QueryKey) =>
    Array.isArray(key) && key[0] === "connectionLocations",
};
