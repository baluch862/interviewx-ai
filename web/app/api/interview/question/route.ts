import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { getSecurityHeaders } from '@/lib/backend-utils';
import { InterviewRepository } from '@/repositories/interview.repository';

export async function GET(req: NextRequest) {
  const headers = getSecurityHeaders();
  try {
    // 1. Authenticate user session
    const authResult = await withAuth(req);
    if (!authResult.isValid || !authResult.user) {
      return authResult.response || NextResponse.json({ error: 'Unauthorized.' }, { status: 401, headers });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const orderIndexStr = searchParams.get('orderIndex');
    const questionId = searchParams.get('questionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing required parameter: sessionId' }, { status: 400, headers });
    }

    // 2. Retrieve session and verify owner
    const session = await InterviewRepository.getSessionById(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Interview session not found.' }, { status: 404, headers });
    }
    if (session.userId !== authResult.user.uid) {
      return NextResponse.json({ error: 'Unauthorized session access.' }, { status: 403, headers });
    }

    // 3. Fetch list of questions for session
    const questions = await InterviewRepository.getQuestions(sessionId);

    // 4. Return correct question
    let question = null;
    if (orderIndexStr) {
      const idx = parseInt(orderIndexStr, 10);
      question = questions.find((q) => q.orderIndex === idx) || null;
    } else if (questionId) {
      question = questions.find((q) => q.questionId === questionId) || null;
    } else {
      // Default to returning the list of all questions
      return NextResponse.json({
        success: true,
        questionsCount: questions.length,
        questions
      }, { status: 200, headers });
    }

    if (!question) {
      return NextResponse.json({ error: 'Question not found.' }, { status: 404, headers });
    }

    return NextResponse.json({
      success: true,
      question
    }, { status: 200, headers });

  } catch (error: any) {
    console.error('API [INTERVIEW_QUESTION] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error occurred.' },
      { status: 500, headers }
    );
  }
}
