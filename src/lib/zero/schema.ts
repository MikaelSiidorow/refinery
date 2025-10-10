import { ANYONE_CAN, definePermissions } from '@rocicorp/zero';
import { schema, type Schema } from './zero-schema.gen';

export { schema, type Schema };

export const permissions = definePermissions<unknown, Schema>(schema, () => ({
	contentIdeas: {
		row: {
			select: ANYONE_CAN
		}
	},
	user: {}
}));
