import { ConvexReactClient } from 'convex/react'

/** Some networks (e.g. the classroom Wi-Fi) drop the browser's connection to `*.convex.cloud`
 * while other hosts work — those students get stuck on "Yuklanmoqda" with a WebSocket error.
 * Traffic can go through a proxy instead:
 * - dev: `VITE_CONVEX_PROXY=1` → the Vite dev server (`/api` → the deployment, see `vite.config.js`);
 * - prod: `VITE_CONVEX_PROXY_URL` → the Cloudflare Worker in `convex-proxy/worker.js`.
 *
 * In prod each browser starts on the route that last worked for it (direct by default). If
 * the WebSocket hasn't connected within `SWITCH_AFTER_MS`, it switches to the other route
 * and reloads — at most once per route per tab session, so it can never loop. */
const DIRECT_URL = import.meta.env.VITE_CONVEX_URL
const devProxy = import.meta.env.DEV && import.meta.env.VITE_CONVEX_PROXY === '1'
const PROXY_URL = devProxy ? window.location.origin : import.meta.env.VITE_CONVEX_PROXY_URL?.replace(/\/+$/, '')

const ROUTE_KEY = 'coin-system:convex-route'
const TRIED_KEY = 'coin-system:convex-routes-tried'
const SWITCH_AFTER_MS = 6000

function safeGet(storage, key) {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(storage, key, value) {
  try {
    storage.setItem(key, value)
  } catch {
    /* storage blocked — the fallback just won't be remembered */
  }
}

const canSwitch = !devProxy && !!PROXY_URL
const route = devProxy ? 'proxy' : canSwitch && safeGet(localStorage, ROUTE_KEY) === 'proxy' ? 'proxy' : 'direct'
const useProxy = route === 'proxy' && !!PROXY_URL

export const convexClient = new ConvexReactClient(useProxy ? PROXY_URL : DIRECT_URL, {
  skipConvexDeploymentUrlCheck: useProxy,
})

if (canSwitch) {
  const tried = new Set((safeGet(sessionStorage, TRIED_KEY) ?? '').split(',').filter(Boolean))
  tried.add(route)
  safeSet(sessionStorage, TRIED_KEY, [...tried].join(','))

  const timer = setTimeout(() => {
    if (convexClient.connectionState().hasEverConnected) return
    const other = route === 'proxy' ? 'direct' : 'proxy'
    if (tried.has(other)) return
    safeSet(localStorage, ROUTE_KEY, other)
    window.location.reload()
  }, SWITCH_AFTER_MS)

  let connected = false
  const unsubscribe = convexClient.subscribeToConnectionState((state) => {
    if (connected || !state.hasEverConnected) return
    connected = true
    clearTimeout(timer)
    safeSet(localStorage, ROUTE_KEY, route)
    queueMicrotask(() => unsubscribe())
  })
}
