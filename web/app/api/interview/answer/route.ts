import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { getSecurityHeaders, checkRateLimit } from '@/lib/backend-utils';
import { InterviewService } from '@/services/interview.service';

export async function POST(req: NextRequest) {
  const headers = getSecurityHeaders();
  try {
    // 1. Rate Limit Checks
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const limitCheck = checkRateLimit(ip);
    if (!limitCheck.success) {
      return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429, headers });
    }

    // 2. Authenticate user session
    const authResult = await withAuth(req);
    if (!authResult.isValid || !authResult.user) {
      return authResult.response || NextResponse.json({ error: 'Unauthorized.' }, { status: 401, headers });
    }

    // 3. Parse input body parameters
    const body = await req.json();
    const { sessionId, questionId, rawTranscript, audioDurationMs, audioUrl } = body;

    if (!sessionId || !questionId || !rawTranscript) {
      return NextResponse.json(
        { error: 'Missing required parameters: sessionId, questionId, or rawTranscript' },
        { status: 400, headers }
      );
    }

    // 4. Submit and evaluate candidate response
    const answer = await InterviewService.evaluateAnswer(
      sessionId,
      questionId,
      authResult.user.uid,
      rawTranscript,
      audioDurationMs ? Number(audioDurationMs) : undefined,
      audioUrl || undefined
    );

    return NextResponse.json({
      success: true,
      message: 'Candidate response submitted and evaluated successfully.',
      answerId: answer.answerId,
      answer
    }, { status: 200, headers });

  } catch (error: any) {
    console.error('API [INTERVIEW_ANSWER] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error occurred.' },
      { status: 500, headers }
    );
  }
}
