import type { RequestHandler } from './$types';
import { handleMutateRequest } from '@rocicorp/zero/server';
import { mustGetMutator } from '@rocicorp/zero';
import { dbProvider } from '$lib/zero/db-provider.server';
import { mutators } from '$lib/zero/mutators';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('refinery-zero');

export const POST: RequestHandler = async ({ request, locals, tracing }) => {
	if (!locals.user) {
		tracing?.current.setAttribute('zero.mutate.unauthorized', true);
		return Response.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const user = locals.user;

	return tracer.startActiveSpan('zero.mutate', async (span) => {
		span.setAttribute('user.id', user.id);

		try {
			const ctx = { userID: user.id };

			const result = await handleMutateRequest(
				dbProvider,
				async (transact) => {
					return await transact(async (tx, name, args) => {
						return tracer.startActiveSpan('zero.mutator', async (mutatorSpan) => {
							mutatorSpan.setAttribute('mutator.name', name);
							mutatorSpan.setAttribute('mutator.argsSize', JSON.stringify(args).length);

							try {
								const mutator = mustGetMutator(mutators, name);
								const mutatorResult = await mutator.fn({ tx, ctx, args });
								mutatorSpan.setStatus({ code: SpanStatusCode.OK });
								return mutatorResult;
							} catch (mutatorError) {
								mutatorSpan.recordException(
									mutatorError instanceof Error ? mutatorError : new Error(String(mutatorError))
								);
								mutatorSpan.setStatus({
									code: SpanStatusCode.ERROR,
									message:
										mutatorError instanceof Error ? mutatorError.message : String(mutatorError)
								});
								throw mutatorError;
							} finally {
								mutatorSpan.end();
							}
						});
					});
				},
				request
			);

			span.setStatus({ code: SpanStatusCode.OK });
			span.end();
			return Response.json(result);
		} catch (error) {
			// Add error context for wide event logging
			locals.ctx.error = error instanceof Error ? error.message : String(error);
			locals.ctx.error_type = error instanceof Error ? error.constructor.name : typeof error;

			span.recordException(error instanceof Error ? error : new Error(String(error)));
			span.setStatus({
				code: SpanStatusCode.ERROR,
				message: error instanceof Error ? error.message : String(error)
			});
			span.end();
			return Response.json({ error: 'Internal server error' }, { status: 500 });
		}
	});
};
