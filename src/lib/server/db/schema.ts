import type { UuidV7 } from '../../utils';
import { relations } from 'drizzle-orm';
import { integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import type { Encrypted } from '../crypto';
import { ARTIFACT_TYPES } from '../../constants/artifact-types';
import { IDEA_STATUSES } from '$lib/constants/idea-statuses';
import { ARTIFACT_STATUSES } from '$lib/constants/artifact-statuses';

/**
 * Defaults must be handled by Zero Mutators. See: https://github.com/rocicorp/drizzle-zero/issues/197
 */
const timestamps = {
	createdAt: timestamp().notNull(),
	updatedAt: timestamp().notNull()
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

export const connectedAccount = pgTable('connected_account', {
	id: uuid().primaryKey().$type<UuidV7>(),
	userId: uuid()
		.notNull()
		.references(() => user.id)
		.$type<UuidV7>(),
	provider: text().notNull(), // 'linkedin' | 'bluesky'
	providerAccountId: text().notNull(), // their user ID on the platform
	username: text(),
	accessToken: text().$type<Encrypted>(),
	refreshToken: text().$type<Encrypted | null>(),
	expiresAt: timestamp(),
	...timestamps
});

export const connectedAccountRelations = relations(connectedAccount, ({ one }) => ({
	user: one(user, {
		fields: [connectedAccount.userId],
		references: [user.id]
	})
}));

export const ideaStatusEnum = pgEnum('idea_status', IDEA_STATUSES);

export const artifactTypeEnum = pgEnum('artifact_type', ARTIFACT_TYPES);

export const artifactStatusEnum = pgEnum('artifact_status', ARTIFACT_STATUSES);

export const contentIdea = pgTable('content_idea', {
	id: uuid().primaryKey().$type<UuidV7>(),
	userId: uuid()
		.notNull()
		.references(() => user.id)
		.$type<UuidV7>(),
	oneLiner: text().notNull(),
	status: ideaStatusEnum().notNull(),
	content: text().notNull(),
	notes: text().notNull(),
	tags: text().array().notNull(),
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
	targetAudience: text().notNull(),
	brandVoice: text().notNull(),
	contentPillars: text().notNull(),
	uniquePerspective: text().notNull(),
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
	status: artifactStatusEnum().notNull(),
	plannedPublishDate: timestamp(),
	publishedAt: timestamp(),
	publishedUrl: text(),
	impressions: integer(),
	likes: integer(),
	comments: integer(),
	shares: integer(),
	notes: text(),
	importedFrom: text(), // 'linkedin' | 'bluesky' | null
	externalId: text(), // original post ID from platform
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

export type ConnectedAccount = typeof connectedAccount.$inferSelect;

export type ContentIdea = typeof contentIdea.$inferSelect;

export type ContentSettings = typeof contentSettings.$inferSelect;

export type ContentArtifact = typeof contentArtifact.$inferSelect;

// Derive enum types
export type { ArtifactType } from '../../constants/artifact-types';
export type ArtifactStatus = (typeof artifactStatusEnum.enumValues)[number];
export type IdeaStatus = (typeof ideaStatusEnum.enumValues)[number];
