import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Primera barrera: sin la cookie de sesión no se entra a las áreas privadas.
 * La raíz del sitio sin sesión lleva a la bienvenida (registro).
 * El rol se comprueba después en cada layout, página y Server Action contra
 * NestJS (GET /auth/me), y la API vuelve a validarlo en cada endpoint.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.get("homy_token")?.value) return NextResponse.next();

  if (request.nextUrl.pathname === "/") return NextResponse.redirect(new URL("/register", request.url));

  const login = new URL("/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/", "/my/:path*", "/worker/:path*", "/admin/:path*"],
};
