import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { FirebaseAdmin } from '@/lib/firebase-admin';
import { getSecurityHeaders, sanitizeInput, checkRateLimit } from '@/lib/backend-utils';
import * as crypto from 'crypto';

export async function POST(req: NextRequest) {
  const headers = getSecurityHeaders();
  try {
    // 1. Check Rate Limit
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.success) {
      return NextResponse.json({ error: 'Too many login attempts. Please wait.' }, { status: 429, headers });
    }

    // 2. Parse and Sanitize Input
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400, headers });
    }

    const sanitizedEmail = sanitizeInput(email.trim().toLowerCase());

    // 3. Match user from firestore secure credentials
    // Note: For a fully integrated Next backend, we query firestore users
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', sanitizedEmail)
    );
    const usersSnap = await getDocs(usersQuery);

    if (usersSnap.empty) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401, headers });
    }

    const userDocSnap = usersSnap.docs[0];
    const userData = userDocSnap.data();

    // Verify hashed password (production standard)
    const salt = userData.salt || 'interviewx_default_salt_91238';
    const hashedPassword = crypto.createHmac('sha256', salt).update(password).digest('hex');

    if (userData.passwordHash && userData.passwordHash !== hashedPassword) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401, headers });
    }

    // 4. Generate custom Session JWT
    const token = FirebaseAdmin.signToken({
      uid: userData.uid,
      email: userData.email,
      role: userData.subscription?.plan === 'free' ? 'user' : 'premium',
      displayName: userData.profile?.displayName || '',
      photoURL: userData.profile?.avatarUrl || ''
    });

    // Update last active stats
    await updateDoc(doc(db, 'users', userData.uid), {
      'stats.lastActiveDate': serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 5. Build response and set HttpOnly session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        uid: userData.uid,
        email: userData.email,
        profile: userData.profile,
        stats: userData.stats,
        subscription: userData.subscription
      }
    }, { status: 200, headers });

    response.cookies.set({
      name: 'session_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400, // 1 day
      path: '/'
    });

    return response;

  } catch (error: any) {
    console.error('API [AUTH_LOGIN] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error occurred.' },
      { status: 500, headers }
    );
  }
}
