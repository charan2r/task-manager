export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

type ApiErrorResponse = {
  message?: string;
  errors?: { field?: string; message: string }[];
};

export async function apiRequest<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = (await response.json().catch(() => ({}))) as ApiErrorResponse;

  if (!response.ok) {
    const validationMessage = data.errors
      ?.map((apiError) => apiError.message)
      .join(" ");
    throw new Error(validationMessage || data.message || "Request failed");
  }

  return data as T;
}
