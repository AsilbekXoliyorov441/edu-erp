import { useState } from 'react'
import { Highlight, themes } from 'prism-react-renderer'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useThemeStore } from '@/shared/lib/store/themeStore'

/** Syntax-highlighted code display for "kod formatida" questions — used in the question
 * editor preview, the teacher's question list, and the student quiz view alike. */
function CodeBlock({ code, className, language = 'jsx' }) {
  const theme = useThemeStore((s) => s.theme)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={cn('group relative overflow-hidden rounded-xl border border-border/60', className)}>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded-lg bg-background/80 text-muted-foreground opacity-0 backdrop-blur transition-opacity hover:text-foreground group-hover:opacity-100"
        aria-label="Nusxalash"
      >
        {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      </button>
      <Highlight theme={theme === 'dark' ? themes.oneDark : themes.oneLight} code={code.trim()} language={language}>
        {({ className: highlightClassName, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={cn(highlightClassName, 'overflow-x-auto px-4 py-3 text-sm')} style={style}>
            {tokens.map((line, i) => {
              const lineProps = getLineProps({ line })
              return (
                <div key={i} {...lineProps}>
                  {line.map((token, tokenIndex) => {
                    const tokenProps = getTokenProps({ token })
                    return <span key={tokenIndex} {...tokenProps} />
                  })}
                </div>
              )
            })}
          </pre>
        )}
      </Highlight>
    </div>
  )
}

export { CodeBlock }
