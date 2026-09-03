import { NextResponse } from "next/server";
import { z } from "zod";
import { backendFetch } from "@/lib/server/backend";
import { normalizeEmail } from "@/lib/server/helpers";

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid sign-up payload." }, { status: 400 });
  }

  const fullName = parsed.data.fullName.trim();
  const email = normalizeEmail(parsed.data.email);
  const password = parsed.data.password;

  const backend = await backendFetch<{ message: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ fullName, email, password }),
  });

  if (!backend.ok) {
    return NextResponse.json(
      { message: backend.message || "Unable to create account." },
      { status: backend.status },
    );
  }

  return NextResponse.json({
    message:
      backend.data.message ||
      "Account created. Check your email for a verification code.",
    email,
  });
}
