export type ApiError = {
  detail?:
    | string
    | Array<{
        loc?: Array<string | number>;
        msg?: string;
      }>;
};

export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    let errorMessage = "Something went wrong";
    try {
      const data = (await response.json()) as ApiError;
      if (typeof data.detail === "string") {
        errorMessage = data.detail;
      } else if (Array.isArray(data.detail) && data.detail.length > 0) {
        const firstIssue = data.detail[0];
        const field = firstIssue.loc?.[firstIssue.loc.length - 1];
        errorMessage = field ? `${String(field)}: ${firstIssue.msg ?? "Invalid value"}` : firstIssue.msg ?? errorMessage;
      }
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
