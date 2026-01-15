import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { createAddHookMessageChannel } from 'import-in-the-middle';
import { register } from 'node:module';

const { registerOptions } = createAddHookMessageChannel();
register('import-in-the-middle/hook.mjs', import.meta.url, registerOptions);

const otlpEndpoint =
	process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';

const sdk = new NodeSDK({
	serviceName: 'refinery-server',
	traceExporter: new OTLPTraceExporter({
		url: otlpEndpoint
	}),
	instrumentations: [
		getNodeAutoInstrumentations({
			'@opentelemetry/instrumentation-fs': {
				enabled: false
			}
		})
	]
});

sdk.start();

console.log(`[OpenTelemetry] Tracing initialized for refinery-server`);
console.log(`[OpenTelemetry] Exporting traces to: ${otlpEndpoint}`);
