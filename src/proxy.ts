import { NextRequest, NextResponse } from "next/server";

// Lightweight cookie check for UX redirects. Real authorization happens
// server-side in every page (requireUser) and API route (apiUserId).
export function proxy(req: NextRequest) {
  const hasSession =
    req.cookies.has("authjs.session-token") || req.cookies.has("__Secure-authjs.session-token");
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/resumes/:path*",
    "/jobs/:path*",
    "/pipeline/:path*",
    "/insights/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/collaborate/:path*",
  ],
};
