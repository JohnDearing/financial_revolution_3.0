const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type BackendSuccess<T> = {
  success: true;
  data: T;
};

type BackendError = {
  success: false;
  message?: string;
};

export async function backendFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  try {
    const headers = new Headers(init?.headers ?? {});
    const isFormData =
      typeof FormData !== "undefined" && init?.body instanceof FormData;

    if (!isFormData && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });

    const payload = (await response.json()) as BackendSuccess<T> | BackendError | T;

    if (!response.ok) {
      const message =
        typeof payload === "object" &&
        payload &&
        "message" in payload &&
        typeof payload.message === "string"
          ? payload.message
          : "Request failed.";
      return { ok: false, status: response.status, message };
    }

    if (
      typeof payload === "object" &&
      payload &&
      "success" in payload &&
      payload.success === true &&
      "data" in payload
    ) {
      return { ok: true, data: (payload as BackendSuccess<T>).data };
    }

    return { ok: true, data: payload as T };
  } catch {
    return {
      ok: false,
      status: 503,
      message: "Unable to reach authentication server. Please try again.",
    };
  }
}
