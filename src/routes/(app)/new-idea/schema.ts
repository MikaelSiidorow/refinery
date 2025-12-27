import * as v from 'valibot';

export const ideaSchema = v.pipe(
	v.string(),
	v.minLength(1, 'Idea cannot be empty'),
	v.maxLength(256, 'Max 256 characters')
);

export type IdeaSchema = v.InferOutput<typeof ideaSchema>;
