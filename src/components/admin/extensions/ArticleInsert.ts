import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import ArticleInsertView from './ArticleInsertView'

export interface ArticleInsertOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    articleInsert: {
      setArticleInsert: (attributes: { postId: string; title: string; slug: string }) => ReturnType
    }
  }
}

export const ArticleInsert = Node.create<ArticleInsertOptions>({
  name: 'articleInsert',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      postId: {
        default: null,
      },
      title: {
        default: null,
      },
      slug: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-article-insert]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-article-insert': '',
        'data-post-id': HTMLAttributes.postId,
        'data-title': HTMLAttributes.title,
        'data-slug': HTMLAttributes.slug,
      }),
      [
        'a',
        {
          href: `/${HTMLAttributes.slug}`,
          class: 'article-insert-link',
        },
        [
          'span',
          { class: 'article-insert-label' },
          'Baca Juga:',
        ],
        ' ',
        HTMLAttributes.title,
      ],
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ArticleInsertView)
  },

  addCommands() {
    return {
      setArticleInsert:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          })
        },
    }
  },
})

export default ArticleInsert
