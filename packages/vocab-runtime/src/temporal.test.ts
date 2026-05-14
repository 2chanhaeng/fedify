import { Temporal } from "@js-temporal/polyfill";
import { strictEqual } from "node:assert";
import { test } from "node:test";
import { isTemporalDuration, isTemporalInstant } from "./temporal.ts";

test("isTemporalInstant() accepts polyfill instances", () => {
  strictEqual(
    isTemporalInstant(Temporal.Instant.from("2026-05-14T00:00:00Z")),
    true,
  );
});

test("isTemporalInstant() accepts spec-compliant non-polyfill objects", () => {
  // Mimics the shape of a native `Temporal.Instant` from a host that does
  // not share class identity with the bundled polyfill.
  const nativeLike = Object.create(null, {
    [Symbol.toStringTag]: { value: "Temporal.Instant" },
    epochNanoseconds: { value: 0n },
  });
  strictEqual(isTemporalInstant(nativeLike), true);
});

test("isTemporalInstant() rejects unrelated values", () => {
  strictEqual(isTemporalInstant(null), false);
  strictEqual(isTemporalInstant(undefined), false);
  strictEqual(isTemporalInstant("2026-05-14T00:00:00Z"), false);
  strictEqual(isTemporalInstant(new Date()), false);
  strictEqual(
    isTemporalInstant(Temporal.Duration.from({ seconds: 1 })),
    false,
  );
});

test("isTemporalInstant() rejects bare objects tagged but missing shape", () => {
  const decoy = Object.create(null, {
    [Symbol.toStringTag]: { value: "Temporal.Instant" },
  });
  strictEqual(isTemporalInstant(decoy), false);
});

test("isTemporalDuration() accepts polyfill instances", () => {
  strictEqual(
    isTemporalDuration(Temporal.Duration.from({ hours: 1 })),
    true,
  );
});

test("isTemporalDuration() accepts spec-compliant non-polyfill objects", () => {
  const nativeLike = Object.create(null, {
    [Symbol.toStringTag]: { value: "Temporal.Duration" },
    sign: { value: 0 },
  });
  strictEqual(isTemporalDuration(nativeLike), true);
});

test("isTemporalDuration() rejects unrelated values", () => {
  strictEqual(isTemporalDuration(null), false);
  strictEqual(isTemporalDuration(undefined), false);
  strictEqual(isTemporalDuration("PT1H"), false);
  strictEqual(
    isTemporalDuration(Temporal.Instant.from("2026-05-14T00:00:00Z")),
    false,
  );
});

test("isTemporalDuration() rejects bare objects tagged but missing shape", () => {
  const decoy = Object.create(null, {
    [Symbol.toStringTag]: { value: "Temporal.Duration" },
  });
  strictEqual(isTemporalDuration(decoy), false);
});
