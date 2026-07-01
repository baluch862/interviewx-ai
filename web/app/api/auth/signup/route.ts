import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { FirebaseAdmin } from '@/lib/firebase-admin';
import { getSecurityHeaders, sanitizeInput } from '@/lib/backend-utils';
import { UserDocument, UserProfile, UserStats, UserSubscription } from '@/types/database';
import * as crypto from 'crypto';

export async function POST(req: NextRequest) {
  const headers = getSecurityHeaders();
  try {
    const body = await req.json();
    const { email, password, displayName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required fields.' },
        { status: 400, headers }
      );
    }

    const sanitizedEmail = sanitizeInput(email.trim().toLowerCase());
    const uid = `usr_${Math.random().toString(36).substring(2, 11)}`;

    // Ensure user doesn't already exist via a fast query
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return NextResponse.json({ error: 'User registration collision. Please retry.' }, { status: 409, headers });
    }

    // Hash password with cryptographically secure dynamic salt
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = crypto.createHmac('sha256', salt).update(password).digest('hex');

    const newProfile: UserProfile = {
      displayName: displayName || sanitizedEmail.split('@')[0],
      avatarUrl: null,
      targetRole: 'Senior Software Engineer',
      targetDifficulty: 'senior',
      experienceYears: 5,
      preferredLanguages: ['TypeScript', 'JavaScript']
    };

    const newStats: UserStats = {
      totalSessionsCount: 0,
      completedSessionsCount: 0,
      averageScore: 0,
      streakCount: 1,
      lastActiveDate: new Date() as any
    };

    const newSubscription: UserSubscription = {
      plan: 'free',
      status: 'active',
      currentPeriodStart: new Date() as any,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) as any
    };

    const newUserDocument = {
      uid,
      email: sanitizedEmail,
      salt,
      passwordHash: hashedPassword,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      profile: newProfile,
      stats: newStats,
      subscription: newSubscription,
      securityEnclaveAgreed: true,
      onboardingCompleted: true
    };

    // Save user profile & credentials safely to Firestore
    await setDoc(userDocRef, newUserDocument);

    // Sign the custom session token
    const token = FirebaseAdmin.signToken({
      uid,
      email: sanitizedEmail,
      role: 'user',
      displayName: newProfile.displayName,
      photoURL: null
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        uid,
        email: sanitizedEmail,
        profile: newProfile,
        stats: newStats,
        subscription: newSubscription
      }
    }, { status: 201, headers });

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
    console.error('API [AUTH_SIGNUP] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error occurred.' },
      { status: 500, headers }
    );
  }
}
