import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { getSecurityHeaders, checkRateLimit, sanitizeInput } from '@/lib/backend-utils';
import { ResumeService } from '@/services/resume.service';

export async function POST(req: NextRequest) {
  const headers = getSecurityHeaders();
  try {
    // 1. Rate Limit Checks
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const limitCheck = checkRateLimit(ip);
    if (!limitCheck.success) {
      return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429, headers });
    }

    // 2. Authenticate user session
    const authResult = await withAuth(req);
    if (!authResult.isValid || !authResult.user) {
      return authResult.response || NextResponse.json({ error: 'Unauthorized access.' }, { status: 401, headers });
    }

    // 3. Parse input fields
    const body = await req.json();
    const { resumeText, targetRole, fileName } = body;

    if (!resumeText) {
      return NextResponse.json({ error: 'Missing required body parameter: resumeText' }, { status: 400, headers });
    }

    const cleanFileName = fileName ? sanitizeInput(fileName) : 'Uploaded_Resume.txt';
    const cleanTargetRole = targetRole ? sanitizeInput(targetRole) : 'Senior Software Engineer';
    const fileSize = Buffer.byteLength(resumeText);

    // 4. Trigger Analysis via service layer
    const report = await ResumeService.analyzeResume(
      authResult.user.uid,
      cleanFileName,
      fileSize,
      resumeText,
      cleanTargetRole
    );

    return NextResponse.json({
      success: true,
      message: 'Resume analyzed and scored successfully.',
      reportId: report.reportId,
      report
    }, { status: 200, headers });

  } catch (error: any) {
    console.error('API [RESUME_ANALYZE] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error occurred.' },
      { status: 500, headers }
    );
  }
}
