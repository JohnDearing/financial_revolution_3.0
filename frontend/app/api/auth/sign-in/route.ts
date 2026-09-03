import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, setSessionCookie } from "@/lib/server/auth";
import { backendFetch } from "@/lib/server/backend";
import { normalizeEmail } from "@/lib/server/helpers";
import { verifyPassword } from "@/lib/server/password";
import { store } from "@/lib/server/store";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type BackendLoginData = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: "member" | "admin";
    isEmailVerified: boolean;
  };
};

async function signInWithLocalStore(email: string, password: string) {
  const userId = store.usersByEmail.get(email);
  if (!userId) return null;

  const user = store.users.get(userId);
  if (!user || !verifyPassword(password, user.passwordHash)) return null;
  if (!user.isEmailVerified) {
    return { error: "Please verify your email before signing in." as const };
  }

  return { user };
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid sign-in payload." }, { status: 400 });
  }

  const email = normalizeEmail(parsed.data.email);
  const password = parsed.data.password;

  // Prefer Express/Postgres backend (seeded member + admin accounts).
  const backend = await backendFetch<BackendLoginData>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (backend.ok) {
    const { user, accessToken, refreshToken } = backend.data;
    const token = await createSessionToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });
    await setSessionCookie(token);

    const response = NextResponse.json({
      message: "Signed in successfully.",
      role: user.role,
    });

    response.cookies.set("fr3_access_token", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 15,
    });
    response.cookies.set("fr3_refresh_token", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  }

  // Fallback to local in-memory store if backend is unavailable.
  if (backend.status === 503) {
    const local = await signInWithLocalStore(email, password);
    if (local && "error" in local) {
      return NextResponse.json({ message: local.error }, { status: 403 });
    }
    if (local?.user) {
      const token = await createSessionToken({
        userId: local.user.id,
        role: local.user.role,
        email: local.user.email,
      });
      await setSessionCookie(token);
      return NextResponse.json({
        message: "Signed in successfully.",
        role: local.user.role,
      });
    }
  }

  return NextResponse.json(
    { message: backend.message || "Invalid credentials." },
    { status: backend.status === 503 ? 401 : backend.status },
  );
}
