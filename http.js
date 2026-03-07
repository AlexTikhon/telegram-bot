function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status) {
  return status >= 500 || status === 429;
}

function isRetryableError(err) {
  const name = err?.name || "";
  const code = err?.code || "";
  return (
    name === "AbortError" ||
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN"
  );
}

export async function fetchWithRetry(url, options = {}) {
  const {
    retries = 2,
    timeoutMs = 7000,
    retryDelayMs = 350,
    ...fetchOptions
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        return response;
      }

      if (attempt < retries && isRetryableStatus(response.status)) {
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }

      throw new Error(`HTTP ${response.status} for ${url}`);
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;

      if (attempt < retries && isRetryableError(err)) {
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }

      throw err;
    }
  }

  throw lastError || new Error(`Request failed for ${url}`);
}
