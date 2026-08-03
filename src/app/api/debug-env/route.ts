import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  let authResult = "NOT_TESTED";
  try {
    const { auth } = await import("@/auth");
    const session = await auth();
    authResult = session ? "SESSION_FOUND" : "NO_SESSION";
  } catch (e: any) {
    authResult = `ERROR: ${e.message}`;
  }
  return NextResponse.json({
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "MISSING",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "MISSING",
    AUTH_SECRET: process.env.AUTH_SECRET || "MISSING",
    AUTH_URL: process.env.AUTH_URL || "MISSING",
    DATABASE_URL: process.env.DATABASE_URL || "MISSING",
    resolved_secret: authSecret ? `SET (${authSecret.substring(0, 4)}...)` : "MISSING",
    auth_test: authResult,
  });
}
