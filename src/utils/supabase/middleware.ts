import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 1. Get the user from Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 2. Define Protected Routes
  // If the user tries to go here without being logged in, kick them out.
  const protectedPaths = ['/anime', '/manga', '/library', '/watch']
  const isProtected = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/' // Redirect to Home/Welcome page
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}