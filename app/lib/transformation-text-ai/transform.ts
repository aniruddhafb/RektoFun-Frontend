export interface TransformRequest {
  category: string;
  statement: string;
}

/**
 * Response format expected from the transformation service.
 * - `status` can be `"suggestions"` when the service returns multiple possible statements,
 *   or `"ok"` for a single successful transformation.
 * - `valid` indicates whether the request was processed successfully.
 * - `statements` contains the generated statements.
 */
export interface TransformResponse {
  status: 'suggestions' | 'ok';
  valid: boolean;
  statements: string[];
}

/**
 * Base URL for the backend API.
 * Falls back to localhost:8000 if the environment variable is not set.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Calls the transformation endpoint and returns the parsed JSON response.
 *
 * @param payload - The request payload containing `category` and `statement`.
 * @returns A promise that resolves to `TransformResponse`.
 *
 * Example:
 * ```ts
 * const result = await transform({
 *   category: 'ipl',
 *   statement: 'Who will win, Mumbai Indians or Rajasthan?',
 * });
 * console.log(result);
 * ```
 */
export async function transform(payload: TransformRequest): Promise<TransformResponse> {
  const response = await fetch(`${API_BASE_URL}/transform`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    // Return a consistent shape on error to match the API contract.
    return {
      status: 'ok',
      valid: false,
      statements: [],
    };
  }

  const data: TransformResponse = await response.json();
  return data;
}