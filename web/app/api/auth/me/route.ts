import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { withAuth } from '@/middleware/auth';
import { getSecurityHeaders } from '@/lib/backend-utils';

export async function GET(req: NextRequest) {
  const headers = getSecurityHeaders();
  try {
    // 1. Verify Authentication Session
    const authResult = await withAuth(req);
    if (!authResult.isValid || !authResult.user) {
      return authResult.response || NextResponse.json({ error: 'Unauthorized session.' }, { status: 401, headers });
    }

    // 2. Fetch Fresh User Profile details from Firestore
    const userDocRef = doc(db, 'users', authResult.user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return NextResponse.json({ error: 'User profile not found in directory.' }, { status: 404, headers });
    }

    const userData = userDocSnap.data();

    // Remove any sensitive salt/password fields before sending to client
    const { passwordHash, salt, ...sanitizedUser } = userData;

    return NextResponse.json({
      success: true,
      user: sanitizedUser
    }, { status: 200, headers });

  } catch (error: any) {
    console.error('API [AUTH_ME] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error occurred.' },
      { status: 500, headers }
    );
  }
}
