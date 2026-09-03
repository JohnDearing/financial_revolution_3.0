import { cookies } from "next/headers";
import { backendFetch } from "@/lib/server/backend";

/** Authenticated proxy helper for member/admin Express APIs. */
export async function backendAuthFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("fr3_access_token")?.value;
  if (!accessToken) {
    return { ok: false, status: 401, message: "Not authenticated." };
  }

  return backendFetch<T>(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });
}

/** @deprecated Use backendAuthFetch */
export const backendMemberFetch = backendAuthFetch;
