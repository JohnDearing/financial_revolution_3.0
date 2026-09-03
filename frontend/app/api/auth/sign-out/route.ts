import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/server/auth";

export async function POST() {
  await clearSessionCookie();
  const response = NextResponse.json({ message: "Signed out." });
  response.cookies.delete("fr3_access_token");
  response.cookies.delete("fr3_refresh_token");
  return response;
}
