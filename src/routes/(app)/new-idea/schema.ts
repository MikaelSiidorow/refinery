import { z } from 'zod';

export const ideaSchema = z
	.string()
	.min(1, { message: 'Idea cannot be empty' })
	.max(256, { message: 'Max 256 characters' });

export type IdeaSchema = z.infer<typeof ideaSchema>;
