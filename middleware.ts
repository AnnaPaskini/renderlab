import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  // Копируем запрос, чтобы можно было модифицировать заголовки
  const res = NextResponse.next();

  // Set pathname header for layout conditional rendering
  res.headers.set('x-pathname', req.nextUrl.pathname);

  // Инициализация Supabase SSR клиента
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string) {
          res.cookies.set(name, value);
        },
        remove(name: string) {
          res.cookies.delete(name);
        },
      },
    }
  );

  // Проверяем текущего пользователя
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Если нет авторизации — редиректим на /login
  if (!user && req.nextUrl.pathname.startsWith("/workspace")) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

// Настройки middleware
export const config = {
  matcher: [
    "/workspace/:path*",
    "/custom/:path*",
    "/prompts/:path*",
    "/history/:path*",
    "/account/:path*",
    "/",
    "/pricing/:path*",
    "/contact/:path*"
  ],
};
