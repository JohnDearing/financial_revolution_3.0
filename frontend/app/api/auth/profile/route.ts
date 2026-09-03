import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSessionToken, getSession, setSessionCookie } from "@/lib/server/auth";
import { backendFetch } from "@/lib/server/backend";
import { ensureLocalMemberMirror, resolveCurrentMember } from "@/lib/server/memberContext";
import { store } from "@/lib/server/store";

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    fullName?: string;
    email?: string;
  };

  const fullName = body.fullName?.trim();
  const email = body.email?.trim().toLowerCase();

  if (!fullName && !email) {
    return NextResponse.json(
      { message: "Provide fullName and/or email to update." },
      { status: 400 },
    );
  }

  if (fullName && fullName.length < 2) {
    return NextResponse.json(
      { message: "Full name must be at least 2 characters." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("fr3_access_token")?.value;

  if (accessToken) {
    const backend = await backendFetch<{
      id: string;
      email: string;
      fullName: string;
      role: "member" | "admin";
      isEmailVerified: boolean;
    }>("/api/members/me", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ fullName, email }),
    });

    if (!backend.ok) {
      return NextResponse.json(
        { message: backend.message },
        { status: backend.status },
      );
    }

    const token = await createSessionToken({
      userId: backend.data.id,
      role: backend.data.role,
      email: backend.data.email,
    });
    await setSessionCookie(token);

    const member = await resolveCurrentMember({
      userId: backend.data.id,
      email: backend.data.email,
      role: backend.data.role,
    });
    if (member) {
      ensureLocalMemberMirror({
        ...member,
        fullName: backend.data.fullName,
        email: backend.data.email,
        isEmailVerified: backend.data.isEmailVerified,
      });
    }

    return NextResponse.json({
      message: "Profile updated successfully.",
      ...backend.data,
    });
  }

  const localId =
    store.usersByEmail.get(session.email.trim().toLowerCase()) ?? session.userId;
  const localUser = store.users.get(localId);
  if (!localUser) {
    return NextResponse.json({ message: "Account not found." }, { status: 404 });
  }

  if (email && email !== localUser.email) {
    if (store.usersByEmail.has(email)) {
      return NextResponse.json({ message: "Email is already in use." }, { status: 409 });
    }
    store.usersByEmail.delete(localUser.email);
    localUser.email = email;
    localUser.isEmailVerified = false;
    store.usersByEmail.set(email, localUser.id);
  }

  if (fullName) localUser.fullName = fullName;
  store.users.set(localUser.id, localUser);

  const token = await createSessionToken({
    userId: localUser.id,
    role: localUser.role,
    email: localUser.email,
  });
  await setSessionCookie(token);

  return NextResponse.json({
    message: "Profile updated successfully.",
    id: localUser.id,
    fullName: localUser.fullName,
    email: localUser.email,
    role: localUser.role,
    isEmailVerified: localUser.isEmailVerified,
  });
}
