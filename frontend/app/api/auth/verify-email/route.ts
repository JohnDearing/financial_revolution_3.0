import { NextResponse } from "next/server";
import { z } from "zod";
import { backendFetch } from "@/lib/server/backend";
import { normalizeEmail } from "@/lib/server/helpers";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid verification payload." },
      { status: 400 },
    );
  }

  const email = normalizeEmail(parsed.data.email);
  const code = parsed.data.code.trim();

  const backend = await backendFetch<{ message: string }>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });

  if (!backend.ok) {
    return NextResponse.json(
      { message: backend.message || "Unable to verify email." },
      { status: backend.status },
    );
  }

  return NextResponse.json({
    message: backend.data.message || "Email verified successfully.",
  });
}
