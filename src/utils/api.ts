/**
 * Fetch wrapper with error handling for API requests
 */
type FetchOptions = RequestInit & {
  baseUrl?: string;
};

export async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { baseUrl = '/api', ...fetchOptions } = options;
  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    ...fetchOptions,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || response.statusText || 'Something went wrong');
  }

  return response.json();
}

/**
 * Helper for POST requests
 */
export async function post<T, D = Record<string, unknown>>(
  endpoint: string,
  data: D,
  options: FetchOptions = {}
): Promise<T> {
  return fetchApi<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
}

/**
 * Helper for GET requests
 */
export async function get<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  return fetchApi<T>(endpoint, {
    method: 'GET',
    ...options,
  });
}

/**
 * Helper for PUT requests
 */
export async function put<T, D = Record<string, unknown>>(
  endpoint: string,
  data: D,
  options: FetchOptions = {}
): Promise<T> {
  return fetchApi<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options,
  });
}

/**
 * Helper for DELETE requests
 */
export async function del<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  return fetchApi<T>(endpoint, {
    method: 'DELETE',
    ...options,
  });
} 