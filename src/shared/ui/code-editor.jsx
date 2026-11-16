import { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { Compartment, EditorState } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'
import { indentUnit } from '@codemirror/language'
import { oneDark } from '@codemirror/theme-one-dark'
import { python } from '@codemirror/lang-python'
import { javascript } from '@codemirror/lang-javascript'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'

const LANGS = { python, javascript, html, css }

/** Seconds between two edits that still count as one stretch of work. */
const IDLE_MS = 60000

const look = EditorView.theme({
  '&': { fontSize: '14px', borderRadius: '12px', overflow: 'hidden' },
  '.cm-scroller': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', lineHeight: '1.55' },
  '.cm-content': { padding: '10px 0' },
  '.cm-gutters': { borderRight: 'none' },
})

/** Highlighting for the language, with Python's 4-space indents (2 elsewhere). */
function languageOf(id) {
  return [LANGS[id] ? LANGS[id]() : [], indentUnit.of(id === 'python' ? '    ' : '  ')]
}

/** A VS Code–style code editor (dark theme, line numbers, highlighting, auto-indent, Tab to
 * indent). It also counts how the code got there — characters typed vs pasted or dropped in —
 * and the time spent editing, reported through `onStats`. Uncontrolled: `value` is only the
 * starting text. */
export function CodeEditor({ value = '', language = 'python', readOnly = false, minHeight = 160, onChange, onStats }) {
  const host = useRef(null)
  const view = useRef(null)
  const handlers = useRef({ onChange, onStats })
  const stats = useRef({ typed: 0, pasted: 0, activeMs: 0, last: 0 })
  const langSlot = useRef(new Compartment())
  const editSlot = useRef(new Compartment())

  useEffect(() => {
    handlers.current = { onChange, onStats }
  }, [onChange, onStats])

  // created once; language and read-only switch through compartments below
  useEffect(() => {
    const listener = EditorView.updateListener.of((update) => {
      if (!update.docChanged) return
      const s = stats.current
      for (const tr of update.transactions) {
        if (!tr.docChanged) continue
        let n = 0
        tr.changes.iterChanges((_fa, _ta, _fb, _tb, inserted) => {
          n += inserted.length
        })
        if (tr.isUserEvent('input.paste') || tr.isUserEvent('input.drop')) s.pasted += n
        else if (tr.isUserEvent('input')) s.typed += n
      }
      const now = Date.now()
      if (s.last && now - s.last < IDLE_MS) s.activeMs += now - s.last
      s.last = now
      // stats first, so whoever saves on change sees the counts for this edit
      handlers.current.onStats?.({ typed: s.typed, pasted: s.pasted, activeMs: s.activeMs })
      handlers.current.onChange?.(update.state.doc.toString())
    })
    const v = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          keymap.of([indentWithTab]),
          oneDark,
          look,
          EditorView.theme({ '.cm-content, .cm-gutter': { minHeight: `${minHeight}px` } }),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({ autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false' }),
          langSlot.current.of(languageOf(language)),
          editSlot.current.of([EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)]),
          listener,
        ],
      }),
    })
    view.current = v
    return () => {
      v.destroy()
      view.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the starting text is read once
  }, [])

  useEffect(() => {
    view.current?.dispatch({ effects: langSlot.current.reconfigure(languageOf(language)) })
  }, [language])

  useEffect(() => {
    view.current?.dispatch({
      effects: editSlot.current.reconfigure([EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)]),
    })
  }, [readOnly])

  return <div ref={host} className="overflow-hidden rounded-xl border border-white/10 bg-[#282c34]" />
}
