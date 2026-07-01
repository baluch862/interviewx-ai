import { NextRequest, NextResponse } from 'next/server';
import { getSecurityHeaders } from '@/lib/backend-utils';

export async function POST(req: NextRequest) {
  const headers = getSecurityHeaders();
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully.'
    }, { status: 200, headers });

    // Expire the HttpOnly session token cookie
    response.cookies.set({
      name: 'session_token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Immediately expire
      path: '/'
    });

    return response;

  } catch (error: any) {
    console.error('API [AUTH_LOGOUT] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error occurred.' },
      { status: 500, headers }
    );
  }
}
