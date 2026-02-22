import { useRef, useCallback } from 'react'
import Editor, { type OnMount, type OnChange } from '@monaco-editor/react'
import { useSettingsStore } from '@/stores/settings'

interface MonacoWrapperProps {
  value: string
  onChange?: (value: string) => void
  language?: string
  readOnly?: boolean
  minimap?: boolean
  height?: string
  className?: string
}

export function MonacoWrapper({
  value,
  onChange,
  language = 'json',
  readOnly = false,
  minimap = false,
  height = '100%',
  className
}: MonacoWrapperProps) {
  const { theme } = useSettingsStore()
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)

  const handleMount: OnMount = useCallback((editor) => {
    editorRef.current = editor
    editor.focus()
  }, [])

  const handleChange: OnChange = useCallback((val) => {
    if (onChange && val !== undefined) onChange(val)
  }, [onChange])

  return (
    <div className={className} style={{ height }}>
      <Editor
        theme={theme === 'dark' ? 'vs-dark' : 'vs'}
        language={language}
        value={value}
        onChange={handleChange}
        onMount={handleMount}
        options={{
          readOnly,
          minimap: { enabled: minimap },
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, monospace",
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          padding: { top: 8, bottom: 8 },
          renderWhitespace: 'selection',
          tabSize: 2,
          bracketPairColorization: { enabled: true },
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on'
        }}
        loading={
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Loading editor...
          </div>
        }
      />
    </div>
  )
}
