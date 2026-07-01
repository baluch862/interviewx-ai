import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { getSecurityHeaders, sanitizeInput, checkRateLimit } from '@/lib/backend-utils';
import { InterviewService } from '@/services/interview.service';
import { InterviewConfig } from '@/types/database';

export async function POST(req: NextRequest) {
  const headers = getSecurityHeaders();
  try {
    // 1. Rate Limit Checks
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const limitCheck = checkRateLimit(ip);
    if (!limitCheck.success) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429, headers });
    }

    // 2. Authenticate user session
    const authResult = await withAuth(req);
    if (!authResult.isValid || !authResult.user) {
      return authResult.response || NextResponse.json({ error: 'Unauthorized.' }, { status: 401, headers });
    }

    // 3. Parse input config parameters
    const body = await req.json();
    const {
      roleTitle,
      companyName,
      difficulty,
      questionCount,
      categories,
      voiceEnabled,
      customJobDescription
    } = body;

    if (!roleTitle || !difficulty || !questionCount || !categories || !Array.isArray(categories)) {
      return NextResponse.json(
        { error: 'Incomplete parameters. roleTitle, difficulty, questionCount, and categories are required.' },
        { status: 400, headers }
      );
    }

    const cleanConfig: InterviewConfig = {
      roleTitle: sanitizeInput(roleTitle),
      companyName: companyName ? sanitizeInput(companyName) : 'Tech Company',
      difficulty: difficulty,
      questionCount: Math.min(Math.max(Number(questionCount) || 3, 1), 10), // clamp between 1 and 10 questions
      categories: categories.map((cat: string) => sanitizeInput(cat) as any),
      voiceEnabled: !!voiceEnabled,
      customJobDescription: customJobDescription ? sanitizeInput(customJobDescription) : undefined
    };

    // 4. Start Session and generate interview questions
    const result = await InterviewService.startSession(authResult.user.uid, cleanConfig);

    return NextResponse.json({
      success: true,
      message: 'Interview session started and tailored questions prepared successfully.',
      sessionId: result.session.sessionId,
      session: result.session,
      firstQuestion: result.firstQuestion
    }, { status: 201, headers });

  } catch (error: any) {
    console.error('API [INTERVIEW_START] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error occurred.' },
      { status: 500, headers }
    );
  }
}
