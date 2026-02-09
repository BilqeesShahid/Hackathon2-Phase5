/** Middleware to protect routes requiring authentication. */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function authMiddleware(request: NextRequest) {
  // Define protected routes
  const protectedRoutes = ["/"];
  const authRoutes = ["/sign-in", "/sign-up"];

  const { pathname } = request.nextUrl;

  // For Next.js App Router, authentication is handled client-side in components
  // since we can't access localStorage in middleware
  // This middleware allows all requests to pass through
  // The actual authentication check happens in the components
  
  // If user is on a protected route but not authenticated, 
  // the component will handle redirecting to sign-in
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
