// Test helpers to avoid JSR dependency issues
// These are simple implementations for testing purposes only

export function assertEquals(actual: unknown, expected: unknown, msg?: string): void {
  if (actual !== expected) {
    throw new Error(
      msg || `Assertion failed: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

export function assertStringIncludes(actual: string, expected: string, msg?: string): void {
  if (!actual.includes(expected)) {
    throw new Error(
      msg || `Assertion failed: expected "${actual}" to include "${expected}"`
    );
  }
}

export function assertArrayIncludes<T>(actual: T[], expected: T, msg?: string): void {
  if (!actual.includes(expected)) {
    throw new Error(
      msg || `Assertion failed: expected array to include ${JSON.stringify(expected)}`
    );
  }
}

export function assertGreaterOrEqual(actual: number, expected: number, msg?: string): void {
  if (actual < expected) {
    throw new Error(
      msg || `Assertion failed: expected ${actual} >= ${expected}`
    );
  }
}
