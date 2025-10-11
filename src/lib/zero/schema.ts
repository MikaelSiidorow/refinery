import {
	createBuilder,
	definePermissions,
	type ExpressionBuilder,
	type Schema as ZeroSchema
} from '@rocicorp/zero';
import { schema as genSchema } from './zero-schema.gen';
import type { AuthData } from './auth';

const schema = {
	...genSchema,
	enableLegacyMutators: false
} satisfies ZeroSchema;

type Schema = typeof schema;

export { schema, type Schema };

export const permissions = definePermissions<AuthData, Schema>(schema, () => {
	const allowIfOwner = (authData: AuthData, { cmp }: ExpressionBuilder<Schema, 'contentIdea'>) =>
		cmp('userId', authData.sub);

	const allowIfSettingsOwner = (
		authData: AuthData,
		{ cmp }: ExpressionBuilder<Schema, 'contentSettings'>
	) => cmp('userId', authData.sub);

	return {
		contentIdea: {
			row: {
				select: [allowIfOwner],
				insert: [allowIfOwner],
				update: {
					preMutation: [allowIfOwner],
					postMutation: [allowIfOwner]
				},
				delete: [allowIfOwner]
			}
		},
		contentSettings: {
			row: {
				select: [allowIfSettingsOwner],
				insert: [allowIfSettingsOwner],
				update: {
					preMutation: [allowIfSettingsOwner],
					postMutation: [allowIfSettingsOwner]
				}
			}
		},
		user: {
			row: {
				select: [(authData, { cmp }) => cmp('id', authData.sub)]
			}
		},
		session: {}
	};
});

export const builder = createBuilder(schema);
