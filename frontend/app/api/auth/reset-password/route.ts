import { NextResponse } from "next/server";
import { z } from "zod";
import { backendFetch } from "@/lib/server/backend";
import { normalizeEmail } from "@/lib/server/helpers";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(8),
});

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid reset payload." }, { status: 400 });
  }

  const email = normalizeEmail(parsed.data.email);
  const code = parsed.data.code.trim();
  const newPassword = parsed.data.newPassword;

  const backend = await backendFetch<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, code, newPassword }),
  });

  if (!backend.ok) {
    return NextResponse.json(
      { message: backend.message || "Unable to reset password." },
      { status: backend.status },
    );
  }

  return NextResponse.json({
    message: backend.data.message || "Password reset successfully.",
  });
}
