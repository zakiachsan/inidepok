'use client'

import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

export default function ArticleInsertView({ node, selected }: NodeViewProps) {
  const { title, slug } = node.attrs

  return (
    <NodeViewWrapper
      className={`article-insert ${selected ? 'ProseMirror-selectednode' : ''}`}
    >
      <a
        href={`/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="article-insert-link"
        contentEditable={false}
      >
        <span className="article-insert-label">Baca Juga:</span>
        {' '}
        {title}
      </a>
    </NodeViewWrapper>
  )
}
