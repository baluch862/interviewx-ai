import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { FirebaseAdmin } from '@/lib/firebase-admin';
import { getSecurityHeaders, sanitizeInput } from '@/lib/backend-utils';
import { UserDocument, UserProfile, UserStats, UserSubscription } from '@/types/database';

export async function POST(req: NextRequest) {
  const headers = getSecurityHeaders();
  try {
    const body = await req.json();
    const { uid, email, displayName, photoURL } = body;

    if (!uid || !email) {
      return NextResponse.json(
        { error: 'Google login credentials incomplete.' },
        { status: 400, headers }
      );
    }

    const sanitizedEmail = sanitizeInput(email.trim().toLowerCase());
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    let finalUser: any;

    if (userDocSnap.exists()) {
      // User already exists, update and fetch details
      const existingData = userDocSnap.data();
      await updateDoc(userDocRef, {
        'stats.lastActiveDate': serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      finalUser = {
        uid,
        email: sanitizedEmail,
        profile: existingData.profile,
        stats: existingData.stats,
        subscription: existingData.subscription
      };
    } else {
      // Register new Federated Google User
      const newProfile: UserProfile = {
        displayName: displayName || sanitizedEmail.split('@')[0],
        avatarUrl: photoURL || null,
        targetRole: 'Senior Software Engineer',
        targetDifficulty: 'senior',
        experienceYears: 5,
        preferredLanguages: ['TypeScript', 'Python']
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        profile: newProfile,
        stats: newStats,
        subscription: newSubscription,
        securityEnclaveAgreed: true,
        onboardingCompleted: true
      };

      await setDoc(userDocRef, newUserDocument);
      finalUser = {
        uid,
        email: sanitizedEmail,
        profile: newProfile,
        stats: newStats,
        subscription: newSubscription
      };
    }

    // Sign Custom Session Token
    const token = FirebaseAdmin.signToken({
      uid,
      email: sanitizedEmail,
      role: finalUser.subscription?.plan === 'free' ? 'user' : 'premium',
      displayName: finalUser.profile?.displayName || '',
      photoURL: finalUser.profile?.avatarUrl || ''
    });

    const response = NextResponse.json({
      success: true,
      message: 'Google login successful.',
      token,
      user: finalUser
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
    console.error('API [AUTH_GOOGLE] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error occurred.' },
      { status: 500, headers }
    );
  }
}
