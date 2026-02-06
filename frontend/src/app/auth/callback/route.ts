import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // 성공적으로 세션 생성
      const response = NextResponse.redirect(new URL(next, request.url))

      // 쿠키 설정
      request.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value)
      })

      return response
    }
  }

  // 오류 발생 시 로그인 페이지로 리다이렉션
  return NextResponse.redirect(new URL('/?auth=failed', request.url))
}
