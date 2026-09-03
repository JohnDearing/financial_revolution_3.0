import { cookies } from "next/headers";
import { getSession } from "@/lib/server/auth";
import { backendFetch } from "@/lib/server/backend";

function firstName(fullName: string) {
  const trimmed = fullName.trim();
  if (!trimmed) return "Profile";
  return trimmed.split(/\s+/)[0] || trimmed;
}

/** Resolves the signed-in user's display name for portal headers. */
export async function getPortalUserName() {
  const session = await getSession();
  if (!session) return "Profile";

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("fr3_access_token")?.value;

  if (accessToken) {
    const backend = await backendFetch<{
      user: { fullName: string };
    }>("/api/members/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (backend.ok && backend.data.user.fullName) {
      return firstName(backend.data.user.fullName);
    }
  }

  if (session.email) {
    return firstName(session.email.split("@")[0] ?? "Profile");
  }

  return "Profile";
}
