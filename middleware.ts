import { NextResponse } from 'next/server'

export function middleware() {
  // Authentication disabled: allow all requests to proceed
  return NextResponse.next()
}

// No route matching restrictions needed when auth is disabled
export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
