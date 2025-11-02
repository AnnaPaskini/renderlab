import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ACCESS_COOKIE_NAME = "renderlab-access-token";

const projectRef = SUPABASE_URL?.replace(/^https?:\/\//, "").split(".")[0];
const SUPABASE_COOKIE_NAME = projectRef ? `sb-${projectRef}-auth-token` : undefined;

const getAccessTokenFromCookie = (req: NextRequest): string | null => {
  const directToken = req.cookies.get(ACCESS_COOKIE_NAME)?.value;
  if (directToken) return directToken;

  const supabaseCookieValue = SUPABASE_COOKIE_NAME
    ? req.cookies.get(SUPABASE_COOKIE_NAME)?.value
    : undefined;

  if (!supabaseCookieValue) return null;

  try {
    const parsed = JSON.parse(supabaseCookieValue);
    if (typeof parsed === "string") {
      return parsed;
    }
    if (Array.isArray(parsed)) {
      const candidate = parsed.find((entry) => entry?.access_token);
      return candidate?.access_token ?? null;
    }
    if (parsed && typeof parsed === "object") {
      return parsed.access_token ?? parsed?.currentSession?.access_token ?? null;
    }
  } catch {
    return null;
  }

  return null;
};

const hasActiveSession = async (req: NextRequest): Promise<boolean> => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return false;
  }

  const accessToken = getAccessTokenFromCookie(req);
  if (!accessToken) {
    return false;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  try {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error) {
      return false;
    }
    return Boolean(data.user);
  } catch {
    return false;
  }
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const requiresAuth =
    pathname.startsWith("/workspace") || pathname.startsWith("/history");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (requiresAuth) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/login";
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  if (!requiresAuth) {
    return NextResponse.next();
  }

  const authenticated = await hasActiveSession(req);

  if (!authenticated) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/workspace/:path*", "/history/:path*"],
};
