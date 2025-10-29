import {
	createBuilder,
	definePermissions,
	type ExpressionBuilder,
	type Schema as ZeroSchema
} from '@rocicorp/zero';
import { schema as genSchema } from './zero-schema.gen';
import type { AuthData, OwnedTable } from './auth';

const schema = {
	...genSchema,
	enableLegacyMutators: false,
	enableLegacyQueries: false
} satisfies ZeroSchema;

type Schema = typeof schema;

export { schema, type Schema };

export const permissions = definePermissions<AuthData, Schema>(schema, () => {
	const allowIfOwner = (authData: AuthData, { cmp }: ExpressionBuilder<Schema, OwnedTable>) =>
		cmp('userId', authData.sub);

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
				select: [allowIfOwner],
				insert: [allowIfOwner],
				update: {
					preMutation: [allowIfOwner],
					postMutation: [allowIfOwner]
				}
			}
		},
		contentArtifact: {
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
		user: {
			row: {
				select: [(authData, { cmp }) => cmp('id', authData.sub)]
			}
		}
	};
});

export const builder = createBuilder(schema);
