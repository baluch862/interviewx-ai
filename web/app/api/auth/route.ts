import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { UserDocument, UserProfile, UserStats, UserSubscription } from '@/types/database';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, email, displayName, photoURL } = body;

    if (!uid || !email) {
      return NextResponse.json(
        { error: 'Missing required parameters: uid and email' },
        { status: 400 }
      );
    }

    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      // User exists, update last active
      await updateDoc(userDocRef, {
        'stats.lastActiveDate': serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return NextResponse.json({ 
        message: 'User session synchronized', 
        user: userDocSnap.data() 
      });
    }

    // Initialize new UserDocument
    const newProfile: UserProfile = {
      displayName: displayName || email.split('@')[0],
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

    const newUser: Omit<UserDocument, 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
      uid,
      email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      profile: newProfile,
      stats: newStats,
      subscription: newSubscription,
      securityEnclaveAgreed: true,
      onboardingCompleted: true
    };

    await setDoc(userDocRef, newUser);

    return NextResponse.json({
      message: 'Workspace provisioned successfully',
      user: newUser
    });

  } catch (error: any) {
    console.error('API [AUTH] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error occurred' },
      { status: 500 }
    );
  }
}
