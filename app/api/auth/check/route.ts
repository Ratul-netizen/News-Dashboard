import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
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
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({ authenticated: true })
}
