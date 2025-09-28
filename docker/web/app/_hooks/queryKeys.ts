//app/_hooks/queryKeys.ts

export const queryKeys = {
  processes: ['processes'] as const,
  ownership: ['ownership'] as const,
  systems: ['systems'] as const,
  
  allApplications: ['applications', 'all'] as const,
  processApplications: (processId: string) => ['process', processId, 'applications'] as const,
};
