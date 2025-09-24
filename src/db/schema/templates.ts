import { pgTable, uuid, text, timestamp, jsonb, boolean, varchar, integer, decimal, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { workspaces } from './workspaces';
import { blocks } from './blocks';

export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Template details
  type: varchar('type', { length: 30 }).notNull(), // workspace, project, task, habit, routine, workflow
  category: varchar('category', { length: 50 }), // productivity, personal, business, education, health
  subcategory: varchar('subcategory', { length: 50 }),
  
  // Creator and ownership
  creatorId: uuid('creator_id').references(() => users.id).notNull(),
  isOfficial: boolean('is_official').default(false), // Official vs community templates
  isVerified: boolean('is_verified').default(false), // Verified quality templates
  
  // Template content
  structure: jsonb('structure').notNull(), // Template structure and configuration
  defaultValues: jsonb('default_values').default({}), // Default values for template variables
  variables: jsonb('variables').default([]), // Configurable template variables
  
  // Visual and branding
  thumbnail: text('thumbnail'), // Template preview image
  screenshots: jsonb('screenshots').default([]), // Additional preview images
  color: varchar('color', { length: 7 }).default('#3b82f6'),
  icon: varchar('icon', { length: 50 }).default('template'),
  
  // Marketplace information
  isPremium: boolean('is_premium').default(false),
  price: decimal('price', { precision: 10, scale: 2 }).default('0'),
  currency: varchar('currency', { length: 3 }).default('USD'),
  
  // Usage and analytics
  useCount: integer('use_count').default(0),
  downloadCount: integer('download_count').default(0),
  favoriteCount: integer('favorite_count').default(0),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0'), // Average rating
  ratingCount: integer('rating_count').default(0),
  
  // Content and metadata
  tags: jsonb('tags').default([]),
  features: jsonb('features').default([]), // Template features and capabilities
  requirements: jsonb('requirements').default({}), // System or plan requirements
  
  // Localization
  locale: varchar('locale', { length: 10 }).default('en-US'),
  translations: jsonb('translations').default({}), // Multi-language support
  
  // Version and updates
  version: varchar('version', { length: 20 }).default('1.0.0'),
  changelog: jsonb('changelog').default([]), // Version history
  compatibilityVersion: varchar('compatibility_version', { length: 20 }),
  
  // Publishing and approval
  status: varchar('status', { length: 20 }).default('draft'), // draft, pending, approved, rejected, published, archived
  publishedAt: timestamp('published_at'),
  moderatedBy: uuid('moderated_by').references(() => users.id),
  moderatedAt: timestamp('moderated_at'),
  rejectionReason: text('rejection_reason'),
  
  // Discovery and SEO
  slug: varchar('slug', { length: 100 }).unique(),
  searchKeywords: jsonb('search_keywords').default([]),
  seoTitle: varchar('seo_title', { length: 255 }),
  seoDescription: text('seo_description'),
  
  // Usage permissions
  license: varchar('license', { length: 50 }).default('mit'), // mit, cc0, proprietary, etc.
  allowModification: boolean('allow_modification').default(true),
  allowCommercialUse: boolean('allow_commercial_use').default(true),
  requireAttribution: boolean('require_attribution').default(false),
  
  // Analytics and insights
  conversionRate: decimal('conversion_rate', { precision: 5, scale: 2 }), // Download to usage rate
  retentionRate: decimal('retention_rate', { precision: 5, scale: 2 }), // User retention after using template
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at')
}, (table) => ({
  creatorIdIdx: index('templates_creator_id_idx').on(table.creatorId),
  typeIdx: index('templates_type_idx').on(table.type),
  categoryIdx: index('templates_category_idx').on(table.category),
  statusIdx: index('templates_status_idx').on(table.status),
  isOfficialIdx: index('templates_is_official_idx').on(table.isOfficial),
  isPremiumIdx: index('templates_is_premium_idx').on(table.isPremium),
  ratingIdx: index('templates_rating_idx').on(table.rating),
  publishedAtIdx: index('templates_published_at_idx').on(table.publishedAt),
  slugIdx: index('templates_slug_idx').on(table.slug)
}));

export const templateCategories = pgTable('template_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  
  // Hierarchy
  parentId: uuid('parent_id'),
  level: integer('level').default(0),
  path: varchar('path', { length: 500 }), // Hierarchical path like /business/marketing
  
  // Visual
  icon: varchar('icon', { length: 50 }),
  color: varchar('color', { length: 7 }),
  image: text('image'),
  
  // Metadata
  templateCount: integer('template_count').default(0),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  parentIdIdx: index('template_categories_parent_id_idx').on(table.parentId),
  slugIdx: index('template_categories_slug_idx').on(table.slug),
  isActiveIdx: index('template_categories_is_active_idx').on(table.isActive)
}));

export const templateUsage = pgTable('template_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').references(() => templates.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  
  // Usage details
  action: varchar('action', { length: 20 }).notNull(), // viewed, downloaded, used, favorited, rated
  context: jsonb('context').default({}), // Additional context about the usage
  
  // Created resources
  createdWorkspaceId: uuid('created_workspace_id').references(() => workspaces.id),
  createdBlockIds: jsonb('created_block_ids').default([]), // IDs of blocks created from template
  
  // Customization and feedback
  customizations: jsonb('customizations').default({}), // How the template was customized
  satisfaction: integer('satisfaction'), // 1-10 satisfaction rating
  feedback: text('feedback'), // User feedback about the template
  
  // Success metrics
  completionRate: decimal('completion_rate', { precision: 5, scale: 2 }), // How much of template was completed
  timeSaved: integer('time_saved'), // Self-reported time saved (minutes)
  
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  templateIdIdx: index('template_usage_template_id_idx').on(table.templateId),
  userIdIdx: index('template_usage_user_id_idx').on(table.userId),
  workspaceIdIdx: index('template_usage_workspace_id_idx').on(table.workspaceId),
  actionIdx: index('template_usage_action_idx').on(table.action),
  createdAtIdx: index('template_usage_created_at_idx').on(table.createdAt)
}));

export const templateReviews = pgTable('template_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').references(() => templates.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  // Review content
  rating: integer('rating').notNull(), // 1-5 star rating
  title: varchar('title', { length: 255 }),
  content: text('content'),
  
  // Review metadata
  isVerifiedPurchase: boolean('is_verified_purchase').default(false),
  isRecommended: boolean('is_recommended'),
  helpfulCount: integer('helpful_count').default(0),
  reportCount: integer('report_count').default(0),
  
  // Moderation
  status: varchar('status', { length: 20 }).default('published'), // published, hidden, flagged, removed
  moderatedBy: uuid('moderated_by').references(() => users.id),
  moderatedAt: timestamp('moderated_at'),
  moderationReason: text('moderation_reason'),
  
  // Response from creator
  creatorResponse: text('creator_response'),
  creatorResponseAt: timestamp('creator_response_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at')
}, (table) => ({
  templateIdIdx: index('template_reviews_template_id_idx').on(table.templateId),
  userIdIdx: index('template_reviews_user_id_idx').on(table.userId),
  ratingIdx: index('template_reviews_rating_idx').on(table.rating),
  statusIdx: index('template_reviews_status_idx').on(table.status),
  createdAtIdx: index('template_reviews_created_at_idx').on(table.createdAt)
}));

export const templateCollections = pgTable('template_collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Collection details
  curatorId: uuid('curator_id').references(() => users.id).notNull(),
  type: varchar('type', { length: 20 }).default('user'), // user, featured, seasonal, trending
  
  // Visual
  thumbnail: text('thumbnail'),
  color: varchar('color', { length: 7 }).default('#3b82f6'),
  icon: varchar('icon', { length: 50 }).default('collection'),
  
  // Visibility and access
  isPublic: boolean('is_public').default(false),
  isFeatured: boolean('is_featured').default(false),
  slug: varchar('slug', { length: 100 }).unique(),
  
  // Content
  templateIds: jsonb('template_ids').default([]), // Ordered list of template IDs
  templateCount: integer('template_count').default(0),
  
  // Engagement
  followCount: integer('follow_count').default(0),
  viewCount: integer('view_count').default(0),
  
  // Metadata
  tags: jsonb('tags').default([]),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at')
}, (table) => ({
  curatorIdIdx: index('template_collections_curator_id_idx').on(table.curatorId),
  typeIdx: index('template_collections_type_idx').on(table.type),
  isPublicIdx: index('template_collections_is_public_idx').on(table.isPublic),
  isFeaturedIdx: index('template_collections_is_featured_idx').on(table.isFeatured),
  slugIdx: index('template_collections_slug_idx').on(table.slug)
}));

export const templateFavorites = pgTable('template_favorites', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').references(() => templates.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  // Organization
  collectionId: uuid('collection_id').references(() => templateCollections.id),
  tags: jsonb('tags').default([]),
  notes: text('notes'),
  
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  templateIdIdx: index('template_favorites_template_id_idx').on(table.templateId),
  userIdIdx: index('template_favorites_user_id_idx').on(table.userId),
  templateUserIdx: index('template_favorites_template_user_idx').on(table.templateId, table.userId)
}));

export const templateSubmissions = pgTable('template_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').references(() => templates.id).notNull(),
  submitterId: uuid('submitter_id').references(() => users.id).notNull(),
  
  // Submission details
  type: varchar('type', { length: 20 }).notNull(), // new_template, update, report, takedown_request
  description: text('description').notNull(),
  
  // Content
  changes: jsonb('changes').default({}), // Proposed changes for updates
  evidence: jsonb('evidence').default([]), // Supporting evidence for reports
  
  // Status and processing
  status: varchar('status', { length: 20 }).default('pending'), // pending, reviewing, approved, rejected, closed
  reviewerId: uuid('reviewer_id').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  resolution: text('resolution'),
  
  // Priority and categorization
  priority: varchar('priority', { length: 10 }).default('normal'), // low, normal, high, urgent
  category: varchar('category', { length: 30 }), // quality, content, copyright, spam, inappropriate
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  templateIdIdx: index('template_submissions_template_id_idx').on(table.templateId),
  submitterIdIdx: index('template_submissions_submitter_id_idx').on(table.submitterId),
  statusIdx: index('template_submissions_status_idx').on(table.status),
  typeIdx: index('template_submissions_type_idx').on(table.type),
  priorityIdx: index('template_submissions_priority_idx').on(table.priority)
}));

export const templateRelations = relations(templates, ({ one, many }) => ({
  creator: one(users, {
    fields: [templates.creatorId],
    references: [users.id]
  }),
  moderator: one(users, {
    fields: [templates.moderatedBy],
    references: [users.id]
  }),
  usage: many(templateUsage),
  reviews: many(templateReviews),
  favorites: many(templateFavorites),
  submissions: many(templateSubmissions)
}));

export const templateCategoryRelations = relations(templateCategories, ({ one, many }) => ({
  parent: one(templateCategories, {
    fields: [templateCategories.parentId],
    references: [templateCategories.id]
  }),
  children: many(templateCategories)
}));

export const templateUsageRelations = relations(templateUsage, ({ one }) => ({
  template: one(templates, {
    fields: [templateUsage.templateId],
    references: [templates.id]
  }),
  user: one(users, {
    fields: [templateUsage.userId],
    references: [users.id]
  }),
  workspace: one(workspaces, {
    fields: [templateUsage.workspaceId],
    references: [workspaces.id]
  }),
  createdWorkspace: one(workspaces, {
    fields: [templateUsage.createdWorkspaceId],
    references: [workspaces.id]
  })
}));

export const templateReviewRelations = relations(templateReviews, ({ one }) => ({
  template: one(templates, {
    fields: [templateReviews.templateId],
    references: [templates.id]
  }),
  user: one(users, {
    fields: [templateReviews.userId],
    references: [users.id]
  }),
  moderator: one(users, {
    fields: [templateReviews.moderatedBy],
    references: [users.id]
  })
}));

export const templateCollectionRelations = relations(templateCollections, ({ one, many }) => ({
  curator: one(users, {
    fields: [templateCollections.curatorId],
    references: [users.id]
  }),
  favorites: many(templateFavorites)
}));

export const templateFavoriteRelations = relations(templateFavorites, ({ one }) => ({
  template: one(templates, {
    fields: [templateFavorites.templateId],
    references: [templates.id]
  }),
  user: one(users, {
    fields: [templateFavorites.userId],
    references: [users.id]
  }),
  collection: one(templateCollections, {
    fields: [templateFavorites.collectionId],
    references: [templateCollections.id]
  })
}));

export const templateSubmissionRelations = relations(templateSubmissions, ({ one }) => ({
  template: one(templates, {
    fields: [templateSubmissions.templateId],
    references: [templates.id]
  }),
  submitter: one(users, {
    fields: [templateSubmissions.submitterId],
    references: [users.id]
  }),
  reviewer: one(users, {
    fields: [templateSubmissions.reviewerId],
    references: [users.id]
  })
}));

export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
export type TemplateCategory = typeof templateCategories.$inferSelect;
export type NewTemplateCategory = typeof templateCategories.$inferInsert;
export type TemplateUsage = typeof templateUsage.$inferSelect;
export type NewTemplateUsage = typeof templateUsage.$inferInsert;
export type TemplateReview = typeof templateReviews.$inferSelect;
export type NewTemplateReview = typeof templateReviews.$inferInsert;
export type TemplateCollection = typeof templateCollections.$inferSelect;
export type NewTemplateCollection = typeof templateCollections.$inferInsert;
export type TemplateFavorite = typeof templateFavorites.$inferSelect;
export type NewTemplateFavorite = typeof templateFavorites.$inferInsert;
export type TemplateSubmission = typeof templateSubmissions.$inferSelect;
export type NewTemplateSubmission = typeof templateSubmissions.$inferInsert;

// Alias exports for backwards compatibility
export { templateFavorites as templateLikes };