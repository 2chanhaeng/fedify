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
 * The guard verifies the spec-mandated `Symbol.toStringTag` and that the
 * `epochNanoseconds` accessor exposes a `bigint`.  Together they reject bare
 * objects whose tag was set to `"Temporal.Instant"` without exposing the
 * rest of the shape, including the case where the property exists but holds
 * a value of the wrong type.
 *
 * @param value The value to test.
 * @returns `true` if the value reports `Temporal.Instant` via
 *          `Symbol.toStringTag` and exposes a `bigint`-valued
 *          `epochNanoseconds`; `false` otherwise.
 */
export function isTemporalInstant(value: unknown): value is Temporal.Instant {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.prototype.toString.call(value) === "[object Temporal.Instant]" &&
    "epochNanoseconds" in value &&
    typeof value.epochNanoseconds === "bigint"
  );
}

/**
 * Checks whether the given value is a `Temporal.Duration` object, regardless
 * of whether it came from a polyfill or the host's native implementation.
 *
 * The guard verifies the spec-mandated `Symbol.toStringTag` and that the
 * `sign` accessor exposes a `number`.  Together they reject bare objects
 * whose tag was set to `"Temporal.Duration"` without exposing the rest of
 * the shape, including the case where the property exists but holds a
 * value of the wrong type.
 *
 * @param value The value to test.
 * @returns `true` if the value reports `Temporal.Duration` via
 *          `Symbol.toStringTag` and exposes a `number`-valued `sign`;
 *          `false` otherwise.
 */
export function isTemporalDuration(value: unknown): value is Temporal.Duration {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.prototype.toString.call(value) === "[object Temporal.Duration]" &&
    "sign" in value &&
    typeof value.sign === "number"
  );
}
