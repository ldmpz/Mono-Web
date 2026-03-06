import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request: {
            headers: request.headers,
        },
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
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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

    const { data: { user } } = await supabase.auth.getUser()

    // 1. Unauthenticated users to login, except if they are already there or on pure static/marketing paths
    // Dashboards usually live at root, /crm, /finance, /metrics, /settings 
    // We assume the agency site is separate or dashboard is protected.
    const isDashboardRoute =
        request.nextUrl.pathname.startsWith('/crm') ||
        request.nextUrl.pathname.startsWith('/finance') ||
        request.nextUrl.pathname.startsWith('/metrics') ||
        request.nextUrl.pathname.startsWith('/settings') ||
        request.nextUrl.pathname.startsWith('/admin')

    if (!user && isDashboardRoute && request.nextUrl.pathname !== '/admin/login') {
        const url = request.nextUrl.clone()
        url.pathname = '/admin/login'
        return NextResponse.redirect(url)
    }

    // 2. Simple RBAC implementation for Metrics page
    // For large scale, store role in JWT claims. Doing DB lookup in edge middleware triggers cold starts/latency,
    // but works fine for small teams.
    if (user && request.nextUrl.pathname.startsWith('/metrics')) {
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        // Sales should not see metrics in this example
        if (userData?.role === 'sales') {
            const url = request.nextUrl.clone()
            url.pathname = '/crm'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
