/// <reference lib="esnext.temporal" />
/**
 * Type guards for `Temporal` namespace objects.
 *
 * Fedify accepts both runtime polyfills (e.g. `@js-temporal/polyfill`,
 * `temporal-polyfill`) and the host's native `Temporal` implementation
 * (Node.js 26+, Bun, Deno). The guards below rely on `Symbol.toStringTag`,
 * which is mandated by the Temporal specification, so they accept any
 * spec-conformant implementation regardless of which class produced the
 * value.
 *
 * @module
 */

/**
 * Checks whether the given value is a `Temporal.Instant` object, regardless
 * of whether it came from a polyfill or the host's native implementation.
 *
 * @param value The value to test.
 * @returns `true` if the value reports `Temporal.Instant` via
 *          `Symbol.toStringTag`; `false` otherwise.
 */
export function isTemporalInstant(value: unknown): value is Temporal.Instant {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { [Symbol.toStringTag]?: unknown })[Symbol.toStringTag] ===
      "Temporal.Instant"
  );
}

/**
 * Checks whether the given value is a `Temporal.Duration` object, regardless
 * of whether it came from a polyfill or the host's native implementation.
 *
 * @param value The value to test.
 * @returns `true` if the value reports `Temporal.Duration` via
 *          `Symbol.toStringTag`; `false` otherwise.
 */
export function isTemporalDuration(value: unknown): value is Temporal.Duration {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { [Symbol.toStringTag]?: unknown })[Symbol.toStringTag] ===
      "Temporal.Duration"
  );
}
