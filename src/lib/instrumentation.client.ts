import { WebTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

let initialized = false;

export function initClientTracing(config: { endpoint: string; serviceName?: string }) {
	if (initialized || typeof window === 'undefined') {
		return;
	}

	const resource = resourceFromAttributes({
		[ATTR_SERVICE_NAME]: config.serviceName ?? 'refinery-client',
		[ATTR_SERVICE_VERSION]: '0.0.1'
	});

	const exporter = new OTLPTraceExporter({
		url: config.endpoint
	});

	const provider = new WebTracerProvider({
		resource,
		spanProcessors: [new BatchSpanProcessor(exporter)]
	});

	provider.register({
		contextManager: new ZoneContextManager()
	});

	registerInstrumentations({
		instrumentations: [
			new FetchInstrumentation({
				propagateTraceHeaderCorsUrls: [/.*/],
				clearTimingResources: true
			}),
			new DocumentLoadInstrumentation()
		]
	});

	initialized = true;

	console.log('[OpenTelemetry] Client tracing initialized');
	console.log(`[OpenTelemetry] Exporting client traces to: ${config.endpoint}`);
}
