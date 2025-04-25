/**
 * Retry a promise-returning function with exponential backoff.
 * @param fn Function that returns a promise.
 * @param retries Number of retry attempts.
 * @param delayMs Initial delay in milliseconds.
 */
export async function retry<T>(fn: () => Promise<T>, retries = 3, delayMs = 500): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(res => setTimeout(res, delayMs));
    return retry(fn, retries - 1, delayMs * 2);
  }
}