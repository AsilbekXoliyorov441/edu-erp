import { ConvexReactClient } from 'convex/react'

/** In dev, `VITE_CONVEX_PROXY=1` routes Convex traffic through the Vite dev server
 * (`/api` → the deployment, see `vite.config.js`) instead of the browser connecting to
 * `*.convex.cloud` itself — for networks that drop the browser's TLS 1.3 handshake to
 * Convex while server-side connections still work. */
const useProxy = import.meta.env.DEV && import.meta.env.VITE_CONVEX_PROXY === '1'

export const convexClient = new ConvexReactClient(useProxy ? window.location.origin : import.meta.env.VITE_CONVEX_URL, {
  skipConvexDeploymentUrlCheck: useProxy,
})
