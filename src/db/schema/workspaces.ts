import { pgTable, uuid, text, timestamp, jsonb, boolean, varchar, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { blocks } from './blocks';

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  
  // Ownership and access
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  isPersonal: boolean('is_personal').default(true),
  isPublic: boolean('is_public').default(false),
  
  // Customization
  color: varchar('color', { length: 7 }).default('#3b82f6'),
  icon: varchar('icon', { length: 50 }).default('folder'),
  coverImage: text('cover_image'),
  
  // Settings and configuration
  settings: jsonb('settings').default({
    defaultView: 'kanban',
    allowComments: true,
    allowDuplicates: false,
    autoArchive: false,
    template: null,
    integrations: {
      calendar: false,
      slack: false,
      github: false
    },
    permissions: {
      allowGuests: false,
      defaultRole: 'viewer'
    }
  }),
  
  // Templates and structure
  templateId: uuid('template_id'),
  isTemplate: boolean('is_template').default(false),
  
  // Collaboration
  members: jsonb('members').default([]),
  maxMembers: integer('max_members').default(10),
  
  // Status and metadata
  isArchived: boolean('is_archived').default(false),
  archivedAt: timestamp('archived_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at')
});

export const workspaceMembers = pgTable('workspace_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'), // owner, admin, member, viewer
  permissions: jsonb('permissions').default({
    read: true,
    write: false,
    delete: false,
    invite: false,
    admin: false
  }),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  invitedBy: uuid('invited_by').references(() => users.id)
});

export const workspaceInvites = pgTable('workspace_invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  token: varchar('token', { length: 255 }).unique().notNull(),
  invitedBy: uuid('invited_by').references(() => users.id).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const workspaceRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, {
    fields: [workspaces.ownerId],
    references: [users.id]
  }),
  blocks: many(blocks),
  members: many(workspaceMembers),
  invites: many(workspaceInvites)
}));

export const workspaceMemberRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id]
  }),
  user: one(users, {
    fields: [workspaceMembers.userId],
    references: [users.id]
  }),
  invitedByUser: one(users, {
    fields: [workspaceMembers.invitedBy],
    references: [users.id]
  })
}));

export const workspaceInviteRelations = relations(workspaceInvites, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceInvites.workspaceId],
    references: [workspaces.id]
  }),
  invitedByUser: one(users, {
    fields: [workspaceInvites.invitedBy],
    references: [users.id]
  })
}));

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type NewWorkspaceMember = typeof workspaceMembers.$inferInsert;
export type WorkspaceInvite = typeof workspaceInvites.$inferSelect;
export type NewWorkspaceInvite = typeof workspaceInvites.$inferInsert;