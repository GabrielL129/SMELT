import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get("host") || "";
  const pathname = url.pathname;

  if (pathname.startsWith("/app/") || pathname.startsWith("/landing")) {
    return NextResponse.next();
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "smelt.world";
  const isLocalhost = hostname.includes("localhost") || hostname.includes("127.0.0.1");

  let subdomain: string | null = null;

  if (isLocalhost) {
    const hostWithoutPort = hostname.split(":")[0];
    const parts = hostWithoutPort.split(".");
    if (parts.length >= 2 && parts[parts.length - 1] === "localhost") {
      subdomain = parts[0];
    }
  } else {
    const hostWithoutPort = hostname.split(":")[0];
    const cleanHost = hostWithoutPort.replace(/^www\./, "");
    if (cleanHost !== rootDomain && cleanHost.endsWith(`.${rootDomain}`)) {
      subdomain = cleanHost.replace(`.${rootDomain}`, "");
    }
  }

  if (subdomain === "app") {
    const newPath = pathname === "/" ? "/app/dashboard" : `/app${pathname}`;
    url.pathname = newPath;
    return NextResponse.rewrite(url);
  }

  if (!subdomain || subdomain === "www") {
    url.pathname = `/landing${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}