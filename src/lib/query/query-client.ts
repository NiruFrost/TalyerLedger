import { MutationCache, QueryClient } from '@tanstack/react-query'
import { logger } from '@/lib/logging/logger'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount) => failureCount < 1,
        refetchOnWindowFocus: false,
        networkMode: 'online',
      },
      mutations: {
        retry: false,
        networkMode: 'online',
      },
    },
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        logger.error('mutation_failed', {
          mutationKey: mutation.options.mutationKey,
          errorName: error instanceof Error ? error.name : 'UnknownError',
        })
      },
    }),
  })
}
