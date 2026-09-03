import { NextResponse } from "next/server";
import { z } from "zod";
import { backendFetch } from "@/lib/server/backend";
import { normalizeEmail } from "@/lib/server/helpers";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
  }

  const email = normalizeEmail(parsed.data.email);

  const backend = await backendFetch<{ message: string }>(
    "/api/auth/forgot-password",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
  );

  if (!backend.ok) {
    return NextResponse.json(
      { message: backend.message || "Unable to submit request." },
      { status: backend.status },
    );
  }

  return NextResponse.json({
    message:
      backend.data.message ||
      "If that email exists, reset instructions have been sent.",
  });
}
