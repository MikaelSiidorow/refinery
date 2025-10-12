import type { UuidV7 } from '$lib/utils';
import { relations } from 'drizzle-orm';
import { integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

const timestamps = {
	createdAt: timestamp()
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: timestamp()
		.$defaultFn(() => new Date())
		.notNull()
		.$onUpdateFn(() => new Date())
};

export const user = pgTable('user', {
	id: uuid().primaryKey().$type<UuidV7>(),

	// GitHub profile data
	githubId: integer().unique().notNull(),
	username: text().notNull(),
	email: text(),
	avatarUrl: text(),

	...timestamps
});

export const session = pgTable('session', {
	id: varchar({ length: 64 }).primaryKey(), // SHA256 hash of token, not UUID
	userId: uuid()
		.notNull()
		.references(() => user.id)
		.$type<UuidV7>(),
	expiresAt: timestamp({ withTimezone: true, mode: 'date' }).notNull()
});

export const ideaStatusEnum = pgEnum('idea_status', [
	'inbox',
	'developing',
	'ready',
	'published',
	'archived',
	'cancelled'
]);

export const artifactTypeEnum = pgEnum('artifact_type', [
	'blog-post',
	'thread',
	'carousel',
	'newsletter',
	'email',
	'short-post',
	'comment'
]);

export const artifactStatusEnum = pgEnum('artifact_status', ['draft', 'ready', 'published']);

export const contentIdea = pgTable('content_idea', {
	id: uuid().primaryKey().$type<UuidV7>(),
	userId: uuid()
		.notNull()
		.references(() => user.id)
		.$type<UuidV7>(),
	oneLiner: text().notNull(),
	status: ideaStatusEnum().notNull().default('inbox'),
	content: text().notNull().default(''),
	notes: text().notNull().default(''),
	...timestamps
});

export const contentIdeaRelations = relations(contentIdea, ({ one }) => ({
	user: one(user, {
		fields: [contentIdea.userId],
		references: [user.id]
	})
}));

export const contentSettings = pgTable('content_settings', {
	id: uuid().primaryKey().$type<UuidV7>(),
	userId: uuid()
		.notNull()
		.unique()
		.references(() => user.id)
		.$type<UuidV7>(),
	targetAudience: text().notNull().default(''),
	brandVoice: text().notNull().default(''),
	contentPillars: text().notNull().default(''),
	uniquePerspective: text().notNull().default(''),
	...timestamps
});

export const contentSettingsRelations = relations(contentSettings, ({ one }) => ({
	user: one(user, {
		fields: [contentSettings.userId],
		references: [user.id]
	})
}));

export const contentArtifact = pgTable('content_artifact', {
	id: uuid().primaryKey().$type<UuidV7>(),
	userId: uuid()
		.notNull()
		.references(() => user.id)
		.$type<UuidV7>(),
	ideaId: uuid()
		.notNull()
		.references(() => contentIdea.id)
		.$type<UuidV7>(),
	title: text(),
	content: text().notNull(),
	artifactType: artifactTypeEnum().notNull(),
	platform: text(),
	status: artifactStatusEnum().notNull().default('draft'),
	publishedAt: timestamp(),
	publishedUrl: text(),
	impressions: integer(),
	likes: integer(),
	comments: integer(),
	shares: integer(),
	notes: text(),
	...timestamps
});

export const contentArtifactRelations = relations(contentArtifact, ({ one }) => ({
	user: one(user, {
		fields: [contentArtifact.userId],
		references: [user.id]
	}),
	idea: one(contentIdea, {
		fields: [contentArtifact.ideaId],
		references: [contentIdea.id]
	})
}));

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

export type ContentIdea = typeof contentIdea.$inferSelect;

export type ContentSettings = typeof contentSettings.$inferSelect;

export type ContentArtifact = typeof contentArtifact.$inferSelect;

// Derive enum types
export type ArtifactType = (typeof artifactTypeEnum.enumValues)[number];
export type ArtifactStatus = (typeof artifactStatusEnum.enumValues)[number];
export type IdeaStatus = (typeof ideaStatusEnum.enumValues)[number];
