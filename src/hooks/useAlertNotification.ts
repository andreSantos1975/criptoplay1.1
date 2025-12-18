import useSWR from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    // This will be caught by the SWR `error` state
    const error = new Error('An error occurred while fetching the notification data.');
    // You can attach more info to the error object if needed
    // error.info = await res.json();
    // error.status = res.status;
    throw error;
  }
  return res.json();
};

export function useAlertNotification() {
  const { data, error, mutate } = useSWR<{ count: number }>(
    '/api/alerts/notifications',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      shouldRetryOnError: false, // Optional: prevent retrying on auth errors etc.
    }
  );

  return {
    notificationCount: data?.count ?? 0,
    isLoading: !error && !data,
    isError: error,
    mutate, // Expose mutate for manual re-fetching
  };
}
