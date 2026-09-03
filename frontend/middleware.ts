import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = ["/member", "/admin", "/onboarding"];
const authPrefixes = ["/auth/sign-in", "/auth/sign-up"];
const secret = new TextEncoder().encode(
  process.env.AUTH_JWT_SECRET ?? "dev-only-secret-change-me",
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAuthScreen = authPrefixes.some((prefix) => pathname.startsWith(prefix));

  const token = request.cookies.get("fr3_session")?.value;

  let session: { role?: string } | null = null;
  if (token) {
    try {
      const verified = await jwtVerify(token, secret);
      session = verified.payload as { role?: string };
    } catch {
      session = null;
    }
  }

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  if (pathname.startsWith("/admin") && session?.role !== "admin") {
    return NextResponse.redirect(new URL("/member", request.url));
  }

  if (isAuthScreen && session) {
    return NextResponse.redirect(
      new URL(session.role === "admin" ? "/admin" : "/member", request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/member/:path*", "/admin/:path*", "/onboarding/:path*", "/auth/:path*"],
};
