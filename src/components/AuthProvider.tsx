
'use client'

import { SessionProvider } from 'next-auth/react'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  // Refetch session every 30 seconds to keep it up-to-date.
  return <SessionProvider refetchInterval={30}>{children}</SessionProvider>
}
