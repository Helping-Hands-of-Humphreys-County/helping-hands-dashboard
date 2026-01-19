import { useEffect, useMemo, useRef } from 'react'
import '@mdxeditor/editor/style.css'

import {
  MDXEditor,
  type MDXEditorMethods,

  // core structure plugins
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,

  // tables/images exported from main package
  tablePlugin,
  imagePlugin,

  // toolbar + components
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  ListsToggle,
  CreateLink,
  InsertTable,
  InsertThematicBreak,
  InsertImage,
  Separator,
} from '@mdxeditor/editor'

// do not import deep plugin paths (build-time resolver issues)

type Props = {
  value: string
  onChange: (md: string) => void
  minHeight?: number
  enableImages?: boolean
}

export function RichTextMarkdownEditor({
  value,
  onChange,
  minHeight = 240,
  enableImages = false,
}: Props) {
  const editorRef = useRef<MDXEditorMethods>(null)

  useEffect(() => {
    const current = editorRef.current?.getMarkdown()
    if (typeof current === 'string' && current !== value) {
      editorRef.current?.setMarkdown(value ?? '')
    }
  }, [value])

  const imageUploadHandler = async (file: File): Promise<string> => {
    throw new Error('Image upload not configured')
  }

  const plugins = useMemo(() => {
    const base = [
      headingsPlugin(),
      listsPlugin(),
      quotePlugin(),
      thematicBreakPlugin(),
      markdownShortcutPlugin(),

      tablePlugin(),

      toolbarPlugin({
        toolbarContents: () => (
          <>
            <UndoRedo />
            <Separator />
            <BlockTypeSelect />
            <Separator />
            <BoldItalicUnderlineToggles />
            <Separator />
            <ListsToggle />
            <Separator />
            <CreateLink />
            <Separator />
            <InsertTable />
            <InsertThematicBreak />
            {enableImages ? <InsertImage /> : null}
          </>
        ),
      }),
    ]

    if (enableImages) {
      base.unshift(
        imagePlugin({
          imageUploadHandler,
          imageAutocompleteSuggestions: [],
        }),
      )
    }

    return base
  }, [enableImages])

  return (
    <div className="rich-markdown-editor" style={{ minHeight }}>
      <MDXEditor
        ref={editorRef}
        markdown={value ?? ''}
        onChange={onChange}
        plugins={plugins}
      />
    </div>
  )
}

export default RichTextMarkdownEditor
