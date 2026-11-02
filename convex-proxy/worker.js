/**
 * Cloudflare Worker: Convex uchun proxy.
 *
 * Ba'zi tarmoqlar (masalan, sinfdagi Wi-Fi) brauzerdan *.convex.cloud ga ulanishni to'sadi.
 * Brauzer bu worker'ga ulanadi, worker esa so'rovni (WebSocket ham) Convex'ga o'tkazadi.
 *
 * TARGET — Vercel'dagi VITE_CONVEX_URL bilan bir xil bo'lishi kerak.
 */
const TARGET = 'https://strong-dotterel-98.convex.cloud'

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const target = new URL(TARGET)
    url.protocol = target.protocol
    url.host = target.host

    // Javob CORS sarlavhalarini Convex o'zi qo'yadi; WebSocket ham shu fetch orqali o'tadi.
    return fetch(new Request(url, request))
  },
}
