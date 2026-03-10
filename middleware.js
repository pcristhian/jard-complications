import { NextResponse } from 'next/server'

export function middleware(request) {
    console.log('🔍 Middleware ejecutado para:', request.nextUrl.pathname)
    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}