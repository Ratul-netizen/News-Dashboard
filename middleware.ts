import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip authentication for login page, API routes, and static files
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public/')
  ) {
    return NextResponse.next()
  }

  // If user is already authenticated (has valid auth header), allow access
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Basic ')) {
    const base64Credentials = authHeader.split(' ')[1]
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
    const [username, password] = credentials.split(':')

    const expectedUsername = process.env.BASIC_AUTH_USERNAME || 'admin'
    const expectedPassword = process.env.BASIC_AUTH_PASSWORD || 'admin123'

    if (username === expectedUsername && password === expectedPassword) {
      return NextResponse.next()
    }
  }

  // If no valid auth header, require authentication
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new Response('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="News Dashboard"',
        'Content-Type': 'text/plain',
      },
    })
  }

  // Decode basic auth credentials
  const base64Credentials = authHeader.split(' ')[1]
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
  const [username, password] = credentials.split(':')

  // Get expected credentials from environment
  const expectedUsername = process.env.BASIC_AUTH_USERNAME || 'admin'
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD || 'admin123'

  // Validate credentials
  if (username !== expectedUsername || password !== expectedPassword) {
    return new Response('Invalid credentials', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="News Dashboard"',
        'Content-Type': 'text/plain',
      },
    })
  }

  // Set a custom header to indicate successful authentication
  const response = NextResponse.next()
  response.headers.set('X-Authenticated', 'true')
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
  ],
}
