import { assert, type UuidV7 } from '$lib/utils';

/** Context passed to queries and mutators via endpoints /api/zero/get-queries and /api/zero/mutate */
export type ZeroContext = {
	userID: UuidV7;
};

export function assertIsOwner<
	T extends {
		userId: UuidV7;
	}
>(ctx: ZeroContext, entity: T | null | undefined, id: UuidV7): asserts entity is T {
	assert(entity, `entity ${id} does not exist`);
	assert(ctx.userID === entity.userId, `User ${ctx.userID} is not the owner of this entity`);
}

declare module '@rocicorp/zero' {
	interface DefaultTypes {
		context: ZeroContext;
	}
}
