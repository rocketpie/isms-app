//app/_hooks/queryKeys.ts

// on change, update kb-5012-nextjs-app-isms-pages.md!
export const queryKeys = {
  allPeople: ['people', 'all'] as const,
  allOwnership: ['ownership', 'all'] as const,
  allProcesses: ['processes', 'all'] as const,
  allApplications: ['applications', 'all'] as const,
  allSystems: ['systems', 'all'] as const,
  allLocations: ['locations', 'all'] as const,
  allData: ['data', 'all'] as const,
  allConnections: ['connections', 'all'] as const,
  processApplications: (processId: string) => ['process', processId, 'applications'] as const,
  applicationSystems: (applicationId: string) => ['application', applicationId, 'systems'] as const,
  systemData: (systemId: string) => ['system', systemId, 'data'] as const,
  locationConnections: (locationId: string) => ['location', locationId, 'connections'] as const
};
