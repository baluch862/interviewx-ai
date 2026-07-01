import { NextRequest, NextResponse } from 'next/server';
import { FirebaseAdmin } from '@/lib/firebase-admin';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    uid: string;
    email: string;
    role: 'user' | 'admin' | 'premium';
  };
}

// NextJS edge/server compatible Authentication middleware helper
export async function withAuth(
  req: NextRequest,
  rolesAllowed: ('user' | 'admin' | 'premium')[] = ['user', 'admin', 'premium']
): Promise<{ isValid: boolean; user?: any; response?: NextResponse }> {
  const authHeader = req.headers.get('Authorization');
  const cookieToken = req.cookies.get('session_token')?.value;

  const token = (authHeader && authHeader.startsWith('Bearer ')) 
    ? authHeader.split(' ')[1] 
    : cookieToken;

  if (!token) {
    return {
      isValid: false,
      response: NextResponse.json(
        { error: 'Authentication required. Access denied.' },
        { status: 401 }
      )
    };
  }

  const decoded = FirebaseAdmin.verifyToken(token);
  if (!decoded) {
    return {
      isValid: false,
      response: NextResponse.json(
        { error: 'Invalid or expired authentication token.' },
        { status: 401 }
      )
    };
  }

  // Check roles permissions
  const userRole = decoded.role || 'user';
  if (!rolesAllowed.includes(userRole)) {
    return {
      isValid: false,
      response: NextResponse.json(
        { error: 'Access denied: Insufficient permissions.' },
        { status: 403 }
      )
    };
  }

  return {
    isValid: true,
    user: {
      uid: decoded.uid,
      email: decoded.email,
      role: userRole,
      displayName: decoded.displayName || '',
      photoURL: decoded.photoURL || ''
    }
  };
}
