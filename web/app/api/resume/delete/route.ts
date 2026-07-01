import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { getSecurityHeaders } from '@/lib/backend-utils';
import { ResumeService } from '@/services/resume.service';

export async function DELETE(req: NextRequest) {
  const headers = getSecurityHeaders();
  try {
    // 1. Authenticate user session
    const authResult = await withAuth(req);
    if (!authResult.isValid || !authResult.user) {
      return authResult.response || NextResponse.json({ error: 'Unauthorized access.' }, { status: 401, headers });
    }

    // 2. Parse reportId parameter
    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get('reportId');

    if (!reportId) {
      return NextResponse.json({ error: 'Missing required query parameter: reportId' }, { status: 400, headers });
    }

    // 3. Delete report safely via Service Layer (verifies ownership)
    await ResumeService.deleteReport(reportId, authResult.user.uid);

    return NextResponse.json({
      success: true,
      message: 'Resume report deleted successfully.',
      reportId
    }, { status: 200, headers });

  } catch (error: any) {
    console.error('API [RESUME_DELETE] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error occurred.' },
      { status: 500, headers }
    );
  }
}
