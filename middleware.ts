import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Don't redirect the landing page (home page)
    if (pathname === "/") {
        return NextResponse.next();
    }

    // Don't redirect if already on beta page
    if (pathname === "/beta") {
        return NextResponse.next();
    }

    // Don't redirect static files, API routes, or next.js internals
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api") ||
        pathname.startsWith("/static") ||
        pathname.startsWith("/favicon") ||
        pathname.endsWith(".png") ||
        pathname.endsWith(".jpg") ||
        pathname.endsWith(".svg") ||
        pathname.endsWith(".ico") ||
        pathname.endsWith(".json") ||
        pathname.endsWith(".css") ||
        pathname.endsWith(".js")
    ) {
        return NextResponse.next();
    }

    // Redirect all other routes to /beta
    return NextResponse.redirect(new URL("/beta", request.url));
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};