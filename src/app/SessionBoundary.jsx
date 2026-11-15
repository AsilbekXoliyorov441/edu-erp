import { Component } from 'react'
import { useAuthStore } from '@/entities/session/model/store'

const SESSION_GONE = 'Tizimga kirish talab qilinadi'

/** Catches render errors under the router. A deleted session (password changed on another
 * device) signs this device out instead of leaving a blank page. Keyed by token in `App`, so
 * it resets after the next sign-in. */
export class SessionBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    if (error?.data === SESSION_GONE) useAuthStore.getState().logout()
    else console.error(error)
  }

  render() {
    if (!this.state.error) return this.props.children
    if (this.state.error?.data === SESSION_GONE) return null
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center text-foreground">
        <p className="font-semibold">Xatolik yuz berdi</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Sahifani yangilash
        </button>
      </div>
    )
  }
}
