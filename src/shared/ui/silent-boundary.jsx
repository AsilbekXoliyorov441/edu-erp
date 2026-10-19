import { Component } from 'react'

/** Renders nothing instead of crashing the page when an optional widget fails (e.g. its
 * Convex query isn't deployed yet). Use only around non-essential UI. */
export class SilentBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.error(error)
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
