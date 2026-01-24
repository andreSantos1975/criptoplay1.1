// src/hooks/useSubscription.ts
import { useQuery } from '@tanstack/react-query';
import { Subscription } from '@prisma/client';

/**
 * Fetches the user's current active subscription.
 * @returns The result of the useQuery hook with subscription data.
 */
export const useSubscription = () => {
  return useQuery<Subscription | null>({
    queryKey: ['currentSubscription'],
    queryFn: async () => {
      const response = await fetch('/api/subscriptions/current');
      if (!response.ok) {
        // If the response is not OK, it could be a server error
        // Returning null as it's a predictable "no subscription" state for the frontend
        if (response.status === 401) return null; 
        throw new Error('Failed to fetch subscription status');
      }
      // If the response is OK but body is empty, it means no active subscription
      const data = await response.json();
      return data;
    },
    // Options to consider for subscription data
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};
