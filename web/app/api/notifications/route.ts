import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import { validateAuthToken, checkRateLimit, getSecurityHeaders } from '@/lib/backend-utils';

export async function GET(req: NextRequest) {
  const headers = getSecurityHeaders();
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const session = await validateAuthToken(req);
    const activeUserId = session?.uid || userId;

    if (!activeUserId) {
      return NextResponse.json({ error: 'Missing required query parameter: userId' }, { status: 400, headers });
    }

    // Query notifications collection
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', activeUserId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const snap = await getDocs(notificationsQuery);
    const notifications: any[] = [];
    snap.forEach(docSnap => {
      notifications.push({ id: docSnap.id, ...docSnap.data() });
    });

    return NextResponse.json({ success: true, notifications }, { status: 200, headers });

  } catch (error: any) {
    console.error('API [NOTIFICATIONS GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error occurred' },
      { status: 500, headers }
    );
  }
}

export async function POST(req: NextRequest) {
  const headers = getSecurityHeaders();
  try {
    const body = await req.json();
    const { userId, type, title, message, actionUrl } = body;

    const session = await validateAuthToken(req);
    const activeUserId = session?.uid || userId;

    if (!activeUserId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required body params: userId, type, title, message' },
        { status: 400, headers }
      );
    }

    const payload = {
      userId: activeUserId,
      type, // 'daily_reminder' | 'weekly_report' | 'interview_reminder' | 'general'
      title,
      message,
      actionUrl: actionUrl || null,
      isRead: false,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'notifications'), payload);

    return NextResponse.json({
      success: true,
      message: 'Notification triggered and stored successfully',
      id: docRef.id,
      notification: payload
    }, { status: 201, headers });

  } catch (error: any) {
    console.error('API [NOTIFICATIONS POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error occurred' },
      { status: 500, headers }
    );
  }
}

// Support updating notification to READ status
export async function PUT(req: NextRequest) {
  const headers = getSecurityHeaders();
  try {
    const body = await req.json();
    const { notificationId, isRead } = body;

    if (!notificationId) {
      return NextResponse.json({ error: 'Missing notificationId parameter' }, { status: 400, headers });
    }

    const docRef = doc(db, 'notifications', notificationId);
    await updateDoc(docRef, {
      isRead: isRead !== undefined ? !!isRead : true,
      updatedAt: serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
      notificationId
    }, { status: 200, headers });

  } catch (error: any) {
    console.error('API [NOTIFICATIONS PUT] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error occurred' },
      { status: 500, headers }
    );
  }
}
