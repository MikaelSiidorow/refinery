import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

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
	id: serial().primaryKey()
});

export const contentIdeas = pgTable('content_ideas', {
	id: serial().primaryKey(),
	oneLiner: text().notNull(),
	...timestamps
});
