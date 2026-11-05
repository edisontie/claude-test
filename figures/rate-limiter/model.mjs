// The token bucket every number and motion in the figure comes from.
// tokens refill continuously at `rate` per second up to CAPACITY;
// a request passes if it can take one whole token, otherwise it gets 429.
export const CAPACITY = 6;
export const RATES = [0.25, 0.5, 1, 2];
export const RATE_INDEX = 1;
export const BURST = 12;

export function bucket(tokens = CAPACITY) {
  return { tokens, passed: 0, rejected: 0 };
}

export function refill(b, rate, dt) {
  b.tokens = Math.min(CAPACITY, b.tokens + rate * dt);
  return b;
}

export function take(b) {
  if (b.tokens >= 1) {
    b.tokens -= 1;
    b.passed++;
    return true;
  }
  b.rejected++;
  return false;
}

// how far the next token has filled (0 when the bucket is full)
export const fraction = (b) => (b.tokens >= CAPACITY ? 0 : b.tokens - Math.floor(b.tokens + 1e-9));

export const source = [`const CAPACITY = ${CAPACITY};`, bucket, refill, take, `const fraction = ${fraction.toString()};`].map(String).join("\n");
