import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createId } from './utils'

// ============================================
// ENUMS
// ============================================

export const roleEnum = pgEnum('Role', ['ADMIN', 'AUTHOR'])
export const postStatusEnum = pgEnum('PostStatus', ['DRAFT', 'PUBLISHED', 'ARCHIVED'])
export const commentStatusEnum = pgEnum('CommentStatus', ['PENDING', 'APPROVED', 'REJECTED'])
export const adTypeEnum = pgEnum('AdType', ['placeholder', 'custom', 'programmatic'])

// ============================================
// USER & AUTH
// ============================================

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(createId),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  role: roleEnum('role').notNull().default('AUTHOR'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow().$onUpdate(() => new Date()),
})

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}))

// ============================================
// CATEGORIES
// ============================================

export const categories = pgTable('categories', {
  id: text('id').primaryKey().$defaultFn(createId),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  parentId: text('parentId'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'categoryTree',
  }),
  children: many(categories, { relationName: 'categoryTree' }),
  postCategories: many(postCategories),
}))

// ============================================
// TAGS
// ============================================

export const tags = pgTable('tags', {
  id: text('id').primaryKey().$defaultFn(createId),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const tagsRelations = relations(tags, ({ many }) => ({
  postTags: many(postTags),
}))

// ============================================
// POSTS
// ============================================

export const posts = pgTable('posts', {
  id: text('id').primaryKey().$defaultFn(createId),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  featuredImage: text('featuredImage'),
  authorId: text('authorId').notNull().references(() => users.id),
  status: postStatusEnum('status').notNull().default('DRAFT'),
  viewCount: integer('viewCount').notNull().default(0),
  publishedAt: timestamp('publishedAt'),
  isPinned: boolean('isPinned').notNull().default(false),
  pinnedOrder: integer('pinnedOrder').notNull().default(0),
  metaTitle: text('metaTitle'),
  metaDescription: text('metaDescription'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('posts_status_published_idx').on(table.status, table.publishedAt),
  index('posts_author_idx').on(table.authorId),
  index('posts_pinned_idx').on(table.isPinned, table.pinnedOrder),
])

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  postCategories: many(postCategories),
  postTags: many(postTags),
  comments: many(comments),
}))

// ============================================
// POST-CATEGORY JUNCTION
// ============================================

// Prisma names this table _PostCategories (from @relation("PostCategories"))
// Column A = categoryId (Category comes before Post alphabetically)
// Column B = postId
export const postCategories = pgTable('_PostCategories', {
  categoryId: text('A').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  postId: text('B').notNull().references(() => posts.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.categoryId, table.postId] }),
])

export const postCategoriesRelations = relations(postCategories, ({ one }) => ({
  post: one(posts, {
    fields: [postCategories.postId],
    references: [posts.id],
  }),
  category: one(categories, {
    fields: [postCategories.categoryId],
    references: [categories.id],
  }),
}))

// ============================================
// POST-TAG JUNCTION
// ============================================

// Prisma names this table _PostTags (from @relation("PostTags"))
// Column A = postId (Post comes before Tag alphabetically)
// Column B = tagId
export const postTags = pgTable('_PostTags', {
  postId: text('A').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  tagId: text('B').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.postId, table.tagId] }),
])

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, {
    fields: [postTags.postId],
    references: [posts.id],
  }),
  tag: one(tags, {
    fields: [postTags.tagId],
    references: [tags.id],
  }),
}))

// ============================================
// COMMENTS
// ============================================

export const comments = pgTable('comments', {
  id: text('id').primaryKey().$defaultFn(createId),
  postId: text('postId').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  authorName: text('authorName').notNull(),
  authorEmail: text('authorEmail').notNull(),
  content: text('content').notNull(),
  status: commentStatusEnum('status').notNull().default('PENDING'),
  parentId: text('parentId'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
}, (table) => [
  index('comments_post_status_idx').on(table.postId, table.status),
])

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: 'commentReplies',
  }),
  replies: many(comments, { relationName: 'commentReplies' }),
}))

// ============================================
// MEDIA
// ============================================

export const media = pgTable('media', {
  id: text('id').primaryKey().$defaultFn(createId),
  filename: text('filename').notNull(),
  url: text('url').notNull(),
  altText: text('altText'),
  caption: text('caption'),
  mimeType: text('mimeType').notNull(),
  size: integer('size').notNull(),
  uploadedBy: text('uploadedBy'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

// ============================================
// SETTINGS
// ============================================

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})

// ============================================
// MENUS
// ============================================

export const menus = pgTable('menus', {
  id: text('id').primaryKey().$defaultFn(createId),
  name: text('name').notNull(),
  location: text('location').notNull().unique(),
})

export const menusRelations = relations(menus, ({ many }) => ({
  items: many(menuItems),
}))

// ============================================
// MENU ITEMS
// ============================================

export const menuItems = pgTable('menu_items', {
  id: text('id').primaryKey().$defaultFn(createId),
  menuId: text('menuId').notNull().references(() => menus.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  url: text('url').notNull(),
  target: text('target').notNull().default('_self'),
  parentId: text('parentId'),
  order: integer('order').notNull().default(0),
}, (table) => [
  index('menu_items_menu_order_idx').on(table.menuId, table.order),
])

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  menu: one(menus, {
    fields: [menuItems.menuId],
    references: [menus.id],
  }),
  parent: one(menuItems, {
    fields: [menuItems.parentId],
    references: [menuItems.id],
    relationName: 'menuItemTree',
  }),
  children: many(menuItems, { relationName: 'menuItemTree' }),
}))

// ============================================
// ADS
// ============================================

export const ads = pgTable('ads', {
  id: text('id').primaryKey().$defaultFn(createId),
  position: text('position').notNull().unique(),
  name: text('name').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  enabled: boolean('enabled').notNull().default(false),
  type: adTypeEnum('type').notNull().default('placeholder'),
  imageUrl: text('imageUrl'),
  redirectUrl: text('redirectUrl'),
  altText: text('altText'),
  adCode: text('adCode'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('ads_position_idx').on(table.position),
  index('ads_enabled_idx').on(table.enabled),
])

// ============================================
// TYPE EXPORTS
// ============================================

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type Tag = typeof tags.$inferSelect
export type NewTag = typeof tags.$inferInsert
export type Comment = typeof comments.$inferSelect
export type NewComment = typeof comments.$inferInsert
export type Media = typeof media.$inferSelect
export type NewMedia = typeof media.$inferInsert
export type Setting = typeof settings.$inferSelect
export type Menu = typeof menus.$inferSelect
export type MenuItem = typeof menuItems.$inferSelect
export type Ad = typeof ads.$inferSelect
export type NewAd = typeof ads.$inferInsert
