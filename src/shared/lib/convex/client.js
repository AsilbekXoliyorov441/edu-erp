import { ConvexReactClient } from 'convex/react'

/** Some networks (e.g. the classroom Wi-Fi) drop the browser's connection to `*.convex.cloud`
 * while other hosts work, so traffic can go through a proxy instead:
 * - dev: `VITE_CONVEX_PROXY=1` → the Vite dev server (`/api` → the deployment, see `vite.config.js`);
 * - prod: `VITE_CONVEX_PROXY_URL` → the Cloudflare Worker in `convex-proxy/worker.js`. */
const devProxy = import.meta.env.DEV && import.meta.env.VITE_CONVEX_PROXY === '1'
const proxyUrl = devProxy ? window.location.origin : import.meta.env.VITE_CONVEX_PROXY_URL?.replace(/\/+$/, '')

export const convexClient = new ConvexReactClient(proxyUrl || import.meta.env.VITE_CONVEX_URL, {
  skipConvexDeploymentUrlCheck: !!proxyUrl,
})
