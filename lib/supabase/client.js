import { createBrowserClient } from '@supabase/ssr'

let browserClient

export function createClient() {
  // During SSG/prerender both URL and key may be missing; defer to a thin proxy
  // that throws only when actually used at runtime.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return new Proxy(
      {},
      {
        get() {
          throw new Error(
            'Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
          )
        },
      }
    )
  }

  if (!browserClient) {
    browserClient = createBrowserClient(url, key)
  }
  return browserClient
}
