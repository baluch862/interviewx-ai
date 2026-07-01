import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required query parameter: userId' },
        { status: 400 }
      );
    }

    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists()) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      userId,
      user: userSnap.data()
    });

  } catch (error: any) {
    console.error('API [PROFILE_GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, profile, securityEnclaveAgreed, onboardingCompleted } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json(
        { error: 'User record not found' },
        { status: 404 }
      );
    }

    const updates: any = {
      updatedAt: serverTimestamp()
    };

    if (profile) {
      if (profile.displayName) updates['profile.displayName'] = profile.displayName;
      if (profile.avatarUrl !== undefined) updates['profile.avatarUrl'] = profile.avatarUrl;
      if (profile.targetRole) updates['profile.targetRole'] = profile.targetRole;
      if (profile.targetDifficulty) updates['profile.targetDifficulty'] = profile.targetDifficulty;
      if (profile.experienceYears !== undefined) updates['profile.experienceYears'] = Number(profile.experienceYears);
      if (profile.preferredLanguages) updates['profile.preferredLanguages'] = profile.preferredLanguages;
    }

    if (securityEnclaveAgreed !== undefined) {
      updates.securityEnclaveAgreed = securityEnclaveAgreed;
    }

    if (onboardingCompleted !== undefined) {
      updates.onboardingCompleted = onboardingCompleted;
    }

    await updateDoc(userRef, updates);

    const updatedSnap = await getDoc(userRef);

    return NextResponse.json({
      message: 'Operator profile updated successfully',
      user: updatedSnap.data()
    });

  } catch (error: any) {
    console.error('API [PROFILE_UPDATE] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error occurred' },
      { status: 500 }
    );
  }
}
