import { create } from 'zustand'
import { api } from '@convex/_generated/api'
import { convexClient } from '@/shared/lib/convex/client'

const TOKEN_KEY = 'coin-system:token'

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function writeToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* noop */
  }
}

const LOGGED_OUT_FIELDS = {
  token: null,
  role: null,
  tenantRole: null,
  userId: null,
  fullName: null,
  username: null,
  isSuperAdmin: false,
  isDirector: false,
  centerId: null,
  centerName: null,
  centerActive: true,
  coinPriceSom: null,
}

export const useAuthStore = create((set, get) => ({
  ...LOGGED_OUT_FIELDS,
  hydrated: false,

  async hydrate() {
    const token = readToken()
    if (!token) {
      set({ hydrated: true })
      return
    }
    const who = await convexClient.query(api.auth.whoAmI, { token })
    if (!who) {
      writeToken(null)
      set({ hydrated: true })
      return
    }
    set({
      token,
      role: who.role,
      tenantRole: who.tenantRole ?? null,
      userId: who.userId,
      fullName: who.fullName,
      username: who.username ?? null,
      isSuperAdmin: !!who.isSuperAdmin,
      isDirector: !!who.isDirector,
      centerId: who.centerId ?? null,
      centerName: who.centerName ?? null,
      centerActive: who.centerActive ?? true,
      coinPriceSom: who.coinPriceSom ?? null,
      hydrated: true,
    })
  },

  async loginTeacher(username, password) {
    const result = await convexClient.action(api.authActions.loginTeacher, { username, password })
    if (!result.ok) return { ok: false, error: result.error }
    writeToken(result.token)
    set({
      token: result.token,
      role: result.role,
      tenantRole: result.tenantRole ?? null,
      userId: result.userId,
      fullName: result.fullName,
      username: result.username,
      isSuperAdmin: !!result.isSuperAdmin,
      isDirector: !!result.isDirector,
      centerId: result.centerId ?? null,
      centerName: result.centerName ?? null,
      centerActive: true,
      coinPriceSom: result.coinPriceSom ?? null,
    })
    return { ok: true }
  },

  async loginStudent(login, password) {
    const result = await convexClient.action(api.authActions.loginStudent, { login, password })
    if (!result.ok) return { ok: false, error: result.error }
    writeToken(result.token)
    set({ token: result.token, role: result.role, userId: result.userId, fullName: result.fullName, isSuperAdmin: false })
    return { ok: true }
  },

  logout() {
    const token = get().token
    writeToken(null)
    set({ ...LOGGED_OUT_FIELDS })
    if (token) convexClient.mutation(api.auth.logout, { token }).catch(() => {})
  },

  async updateTeacherProfile(patch) {
    const token = get().token
    if (!token) return
    await convexClient.mutation(api.auth.updateTeacherProfile, { token, fullName: patch.fullName })
    set({ fullName: patch.fullName })
  },

  async updateCoinPrice(coinPriceSom) {
    const token = get().token
    if (!token) return
    await convexClient.mutation(api.centers.updateCoinPrice, { token, coinPriceSom })
    set({ coinPriceSom })
  },
}))
