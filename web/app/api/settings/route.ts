import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

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

    const settingsRef = doc(db, 'users', userId, 'settings', 'default');
    const settingsSnap = await getDoc(settingsRef);

    if (!settingsSnap.exists()) {
      // Return default configuration
      const defaultSettings = {
        voiceSynthesizerEnabled: true,
        corporateEnclaveSandboxEnabled: true,
        autoSaveDraftsEnabled: true,
        theme: 'dark',
        ttsVoiceType: 'en-US-Neural2-F',
        preferredAiProvider: 'gemini',
        updatedAt: new Date()
      };
      return NextResponse.json({
        userId,
        settings: defaultSettings,
        isDefault: true
      });
    }

    return NextResponse.json({
      userId,
      settings: settingsSnap.data(),
      isDefault: false
    });

  } catch (error: any) {
    console.error('API [SETTINGS_GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, settings } = body;

    if (!userId || !settings) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId and settings' },
        { status: 400 }
      );
    }

    const settingsRef = doc(db, 'users', userId, 'settings', 'default');
    
    const settingsPayload = {
      voiceSynthesizerEnabled: settings.voiceSynthesizerEnabled !== undefined ? !!settings.voiceSynthesizerEnabled : true,
      corporateEnclaveSandboxEnabled: settings.corporateEnclaveSandboxEnabled !== undefined ? !!settings.corporateEnclaveSandboxEnabled : true,
      autoSaveDraftsEnabled: settings.autoSaveDraftsEnabled !== undefined ? !!settings.autoSaveDraftsEnabled : true,
      theme: settings.theme || 'dark',
      ttsVoiceType: settings.ttsVoiceType || 'en-US-Neural2-F',
      preferredAiProvider: settings.preferredAiProvider || 'gemini',
      updatedAt: serverTimestamp()
    };

    await setDoc(settingsRef, settingsPayload, { merge: true });

    return NextResponse.json({
      message: 'Enclave settings synchronized successfully',
      settings: settingsPayload
    });

  } catch (error: any) {
    console.error('API [SETTINGS_UPDATE] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error occurred' },
      { status: 500 }
    );
  }
}
