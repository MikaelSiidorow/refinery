import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto';
import { SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { createAddHookMessageChannel } from 'import-in-the-middle';
import { register } from 'node:module';

const { registerOptions } = createAddHookMessageChannel();
register('import-in-the-middle/hook.mjs', import.meta.url, registerOptions);

const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';

const resource = resourceFromAttributes({
	[ATTR_SERVICE_NAME]: 'refinery-server',
	[ATTR_SERVICE_VERSION]: '0.0.1'
});

const logExporter = new OTLPLogExporter({
	url: `${otlpEndpoint}/v1/logs`
});

const sdk = new NodeSDK({
	resource,
	traceExporter: new OTLPTraceExporter({
		url: `${otlpEndpoint}/v1/traces`
	}),
	logRecordProcessors: [new SimpleLogRecordProcessor(logExporter)],
	instrumentations: [
		getNodeAutoInstrumentations({
			'@opentelemetry/instrumentation-fs': {
				enabled: false
			},
			'@opentelemetry/instrumentation-pino': {
				enabled: true
			}
		})
	]
});

sdk.start();

console.log(`[OpenTelemetry] Tracing and logging initialized for refinery-server`);
console.log(`[OpenTelemetry] Exporting to: ${otlpEndpoint}`);
