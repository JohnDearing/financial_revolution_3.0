import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/guards";
import { backendAuthFetch } from "@/lib/server/memberApi";

type Params = {
  params: Promise<{ contentId: string }> | { contentId: string };
};

export async function DELETE(_request: Request, context: Params) {
  const auth = await requireRole("admin");
  if ("error" in auth) return auth.error;

  const { contentId } = await Promise.resolve(context.params);
  const backend = await backendAuthFetch(`/api/admin/content/${contentId}`, {
    method: "DELETE",
  });

  if (!backend.ok) {
    return NextResponse.json({ message: backend.message }, { status: backend.status });
  }

  return NextResponse.json(backend.data);
}
