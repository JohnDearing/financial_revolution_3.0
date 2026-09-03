import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/guards";
import { backendAuthFetch } from "@/lib/server/memberApi";

export async function GET() {
  const auth = await requireRole("admin");
  if ("error" in auth) return auth.error;

  const backend = await backendAuthFetch("/api/admin/content");
  if (!backend.ok) {
    return NextResponse.json({ message: backend.message }, { status: backend.status });
  }
  return NextResponse.json(backend.data);
}

export async function POST(request: Request) {
  const auth = await requireRole("admin");
  if ("error" in auth) return auth.error;

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const backend = await backendAuthFetch("/api/admin/content", {
      method: "POST",
      body: formData,
    });
    if (!backend.ok) {
      return NextResponse.json({ message: backend.message }, { status: backend.status });
    }
    return NextResponse.json(backend.data, { status: 201 });
  }

  const body = await request.json();
  const backend = await backendAuthFetch("/api/admin/content", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!backend.ok) {
    return NextResponse.json({ message: backend.message }, { status: backend.status });
  }

  return NextResponse.json(backend.data, { status: 201 });
}
