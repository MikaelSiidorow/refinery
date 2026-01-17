import pino from 'pino';
import { trace } from '@opentelemetry/api';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Mixin to inject OpenTelemetry trace context into every log record.
 * This enables correlation between logs and traces in observability tools like SigNoz.
 */
function traceMixin() {
	const span = trace.getActiveSpan();
	if (!span) return {};

	const spanContext = span.spanContext();
	return {
		trace_id: spanContext.traceId,
		span_id: spanContext.spanId,
		trace_flags: spanContext.traceFlags
	};
}

export const logger = pino({
	level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
	mixin: traceMixin,
	transport: isProduction
		? undefined
		: {
				target: 'pino-pretty',
				options: {
					colorize: true
				}
			}
});

export type WideEvent = {
	// Core request info
	method?: string;
	path?: string;
	route?: string;
	status?: number;
	duration_ms?: number;

	// Auth context
	user_id?: string;
	username?: string;
	session_id?: string;
	auth_status?: 'authenticated' | 'unauthenticated' | 'invalid_session';

	// Error info (if request failed)
	error?: string;
	error_type?: string;

	// Custom context added during request
	[key: string]: unknown;
};

/**
 * Emit a wide event - one canonical log line per request with all accumulated context.
 * Called at request completion in hooks.server.ts
 */
export function emitWideEvent(ctx: WideEvent) {
	const level =
		ctx.status && ctx.status >= 500 ? 'error' : ctx.status && ctx.status >= 400 ? 'warn' : 'info';

	logger[level](
		{
			event: 'request',
			...ctx
		},
		`${ctx.method} ${ctx.path} → ${ctx.status} (${ctx.duration_ms}ms)`
	);
}
