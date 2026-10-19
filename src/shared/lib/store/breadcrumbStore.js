import { create } from 'zustand'

/** Trailing breadcrumb items a page pushes into the global header (e.g. the group name and
 * "17-dars baholash" while a grading session is open). Pages reset it to `null` on unmount. */
export const useBreadcrumbStore = create((set) => ({
  trail: null,
  setTrail: (trail) => set({ trail }),
}))
