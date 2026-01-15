import { WebTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { propagation } from '@opentelemetry/api';

let initialized = false;

export function initClientTracing(config?: { serviceName?: string }) {
	if (initialized || typeof window === 'undefined') {
		return;
	}

	const resource = resourceFromAttributes({
		[ATTR_SERVICE_NAME]: config?.serviceName ?? 'refinery-client',
		[ATTR_SERVICE_VERSION]: '0.0.1'
	});

	// Use same-origin proxy endpoint to avoid CORS and keep collector private
	const exporter = new OTLPTraceExporter({
		url: '/api/telemetry/traces'
	});

	const provider = new WebTracerProvider({
		resource,
		spanProcessors: [new BatchSpanProcessor(exporter)]
	});

	// Register W3C Trace Context propagator for distributed tracing
	propagation.setGlobalPropagator(new W3CTraceContextPropagator());

	provider.register({
		contextManager: new ZoneContextManager()
	});

	registerInstrumentations({
		instrumentations: [
			new FetchInstrumentation({
				propagateTraceHeaderCorsUrls: [/.*/],
				clearTimingResources: true,
				// Don't trace telemetry requests to avoid infinite loops
				ignoreUrls: [/\/api\/telemetry\//]
			}),
			new DocumentLoadInstrumentation()
		]
	});

	initialized = true;

	console.log('[OpenTelemetry] Client tracing initialized');
}
