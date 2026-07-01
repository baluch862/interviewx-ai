import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { getSecurityHeaders } from '@/lib/backend-utils';
import { InterviewService } from '@/services/interview.service';

export async function POST(req: NextRequest) {
  const headers = getSecurityHeaders();
  try {
    // 1. Authenticate user session
    const authResult = await withAuth(req);
    if (!authResult.isValid || !authResult.user) {
      return authResult.response || NextResponse.json({ error: 'Unauthorized.' }, { status: 401, headers });
    }

    // 2. Parse input body parameters
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing required parameter: sessionId' }, { status: 400, headers });
    }

    // 3. Finalize interview session and build executive assessment scorecard report
    const session = await InterviewService.endSession(sessionId, authResult.user.uid);

    return NextResponse.json({
      success: true,
      message: 'Interview session completed and synthesized report scorecard is ready.',
      sessionId: session.sessionId,
      session
    }, { status: 200, headers });

  } catch (error: any) {
    console.error('API [INTERVIEW_END] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error occurred.' },
      { status: 500, headers }
    );
  }
}
