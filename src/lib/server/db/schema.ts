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

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

export type ContentIdea = typeof contentIdea.$inferSelect;
