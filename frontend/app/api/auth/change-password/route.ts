import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/server/auth";
import { backendFetch } from "@/lib/server/backend";
import { hashPassword, verifyPassword } from "@/lib/server/password";
import { store } from "@/lib/server/store";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    currentPassword?: string;
    newPassword?: string;
  };

  const currentPassword = body.currentPassword ?? "";
  const newPassword = body.newPassword ?? "";

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { message: "Current password and new password are required." },
      { status: 400 },
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { message: "New password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("fr3_access_token")?.value;

  if (accessToken) {
    const backend = await backendFetch<{ message: string }>("/api/auth/change-password", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!backend.ok) {
      return NextResponse.json(
        { message: backend.message },
        { status: backend.status },
      );
    }

    await clearSessionCookie();
    const response = NextResponse.json({
      message: backend.data.message ?? "Password updated successfully.",
      requireReauth: true,
    });
    response.cookies.delete("fr3_access_token");
    response.cookies.delete("fr3_refresh_token");
    return response;
  }

  const localId =
    store.usersByEmail.get(session.email.trim().toLowerCase()) ?? session.userId;
  const localUser = store.users.get(localId);
  if (!localUser) {
    return NextResponse.json({ message: "Account not found." }, { status: 404 });
  }

  if (!verifyPassword(currentPassword, localUser.passwordHash)) {
    return NextResponse.json(
      { message: "Current password is incorrect." },
      { status: 400 },
    );
  }

  localUser.passwordHash = hashPassword(newPassword);
  store.users.set(localUser.id, localUser);
  await clearSessionCookie();

  return NextResponse.json({
    message: "Password updated successfully. Please sign in again.",
    requireReauth: true,
  });
}
