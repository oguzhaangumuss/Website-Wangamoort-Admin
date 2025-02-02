import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  try {
    // Oturum durumunu kontrol et
    const { data: { session } } = await supabase.auth.getSession()

    // Eğer public dosyalara erişim varsa veya login sayfasına gidiyorsa devam et
    if (
      req.nextUrl.pathname.startsWith('/_next') ||
      req.nextUrl.pathname.startsWith('/logo4.png') ||
      req.nextUrl.pathname === '/login'
    ) {
      return res
    }

    // Eğer oturum yoksa login sayfasına yönlendir
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    return res
  } catch (error) {
    console.error('Auth error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

// Middleware'in çalışacağı rotalar
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logo4.png (logo file)
     * - login (login page)
     */
    '/((?!_next/static|_next/image|favicon.ico|logo4.png|login).*)',
  ],
} 