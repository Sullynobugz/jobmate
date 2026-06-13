'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import { captureWidFromUrl } from '@/store/appStore'

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // WID-Code aus ?wid= erfassen — läuft beim App-Start auf jeder Route,
    // sodass alle Tracking-Calls (sendWidEvent) ihn automatisch nutzen.
    captureWidFromUrl()

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      person_profiles: 'identified_only',
      capture_pageview: true,
    })
  }, [])

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
