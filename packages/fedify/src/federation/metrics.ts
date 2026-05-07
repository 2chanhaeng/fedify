import {
  type Attributes,
  type Counter,
  type Histogram,
  type MeterProvider,
  metrics,
} from "@opentelemetry/api";
import metadata from "../../deno.json" with { type: "json" };

class FederationMetrics {
  readonly deliverySent: Counter;
  readonly deliveryPermanentFailure: Counter;
  readonly signatureVerificationFailure: Counter;
  readonly deliveryDuration: Histogram;
  readonly inboxProcessingDuration: Histogram;
  readonly httpServerRequestCount: Counter;
  readonly httpServerRequestDuration: Histogram;

  constructor(meterProvider: MeterProvider) {
    const meter = meterProvider.getMeter(metadata.name, metadata.version);
    this.deliverySent = meter.createCounter("activitypub.delivery.sent", {
      description: "ActivityPub delivery attempts.",
      unit: "{attempt}",
    });
    this.deliveryPermanentFailure = meter.createCounter(
      "activitypub.delivery.permanent_failure",
      {
        description: "ActivityPub deliveries abandoned as permanent failures.",
        unit: "{failure}",
      },
    );
    this.signatureVerificationFailure = meter.createCounter(
      "activitypub.signature.verification_failure",
      {
        description: "ActivityPub signature verification failures.",
        unit: "{failure}",
      },
    );
    this.deliveryDuration = meter.createHistogram(
      "activitypub.delivery.duration",
      {
        description: "Duration of ActivityPub delivery attempts.",
        unit: "ms",
      },
    );
    this.inboxProcessingDuration = meter.createHistogram(
      "activitypub.inbox.processing_duration",
      {
        description: "Duration of ActivityPub inbox listener processing.",
        unit: "ms",
      },
    );
    this.httpServerRequestCount = meter.createCounter(
      "fedify.http.server.request.count",
      {
        description: "HTTP requests handled by Federation.fetch().",
        unit: "{request}",
      },
    );
    this.httpServerRequestDuration = meter.createHistogram(
      "fedify.http.server.request.duration",
      {
        description: "Duration of HTTP requests handled by Federation.fetch().",
        unit: "ms",
      },
    );
  }

  recordDelivery(
    inbox: URL,
    durationMs: number,
    success: boolean,
    activityType?: string,
  ): void {
    const deliveryAttributes: Attributes = {
      "activitypub.remote.host": getRemoteHost(inbox),
      "activitypub.delivery.success": success,
    };
    if (activityType != null) {
      deliveryAttributes["activitypub.activity.type"] = activityType;
    }
    this.deliverySent.add(1, deliveryAttributes);
    this.deliveryDuration.record(durationMs, deliveryAttributes);
  }

  recordPermanentFailure(inbox: URL, statusCode: number): void {
    this.deliveryPermanentFailure.add(1, {
      "activitypub.remote.host": getRemoteHost(inbox),
      "http.response.status_code": statusCode,
    });
  }

  recordSignatureVerificationFailure(
    reason: string,
    remoteHost?: string,
  ): void {
    const attributes: Attributes = {
      "activitypub.verification.failure_reason": reason,
    };
    if (remoteHost != null) {
      attributes["activitypub.remote.host"] = remoteHost;
    }
    this.signatureVerificationFailure.add(1, attributes);
  }

  recordInboxProcessingDuration(
    activityType: string,
    durationMs: number,
  ): void {
    this.inboxProcessingDuration.record(durationMs, {
      "activitypub.activity.type": activityType,
    });
  }

  recordHttpServerRequest(
    method: string,
    endpoint: string,
    durationMs: number,
    options: { statusCode?: number; routeTemplate?: string } = {},
  ): void {
    const attributes: Attributes = {
      "http.request.method": normalizeHttpMethod(method),
      "fedify.endpoint": endpoint,
    };
    if (options.statusCode != null) {
      attributes["http.response.status_code"] = options.statusCode;
    }
    if (options.routeTemplate != null) {
      attributes["fedify.route.template"] = options.routeTemplate;
    }
    this.httpServerRequestCount.add(1, attributes);
    this.httpServerRequestDuration.record(durationMs, attributes);
  }
}

const KNOWN_HTTP_METHODS: ReadonlySet<string> = new Set([
  "CONNECT",
  "DELETE",
  "GET",
  "HEAD",
  "OPTIONS",
  "PATCH",
  "POST",
  "PUT",
  "TRACE",
]);

function normalizeHttpMethod(method: string): string {
  const upper = method.toUpperCase();
  return KNOWN_HTTP_METHODS.has(upper) ? upper : "_OTHER";
}

const federationMetrics = new WeakMap<MeterProvider, FederationMetrics>();

/**
 * Gets the cached Fedify metric instruments for a meter provider.
 * @since 2.3.0
 */
export function getFederationMetrics(
  meterProvider: MeterProvider = metrics.getMeterProvider(),
): FederationMetrics {
  let instruments = federationMetrics.get(meterProvider);
  if (instruments == null) {
    instruments = new FederationMetrics(meterProvider);
    federationMetrics.set(meterProvider, instruments);
  }
  return instruments;
}

/**
 * Gets the bounded remote host attribute value for a URL.
 * @since 2.3.0
 */
export function getRemoteHost(url: URL): string {
  return url.hostname;
}

/**
 * Gets an elapsed duration in milliseconds from a `performance.now()` value.
 * @since 2.3.0
 */
export function getDurationMs(start: number): number {
  return Math.max(0, performance.now() - start);
}
