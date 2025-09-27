
export const queryKeys = {
  processes: ['processes'] as const,
  ownership: ['ownership'] as const,
  processApplications: (processId: string) => ['process', processId, 'applications'] as const,
  allApplications: ['applications', 'all'] as const,
};
