import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { getSecurityHeaders, sanitizeInput } from '@/lib/backend-utils';
import { ResumeRepository } from '@/repositories/resume.repository';
import { ResumeReportDocument } from '@/types/database';
import { serverTimestamp } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  const headers = getSecurityHeaders();
  try {
    // 1. Authenticate user session
    const authResult = await withAuth(req);
    if (!authResult.isValid || !authResult.user) {
      return authResult.response || NextResponse.json({ error: 'Unauthorized access.' }, { status: 401, headers });
    }

    const userId = authResult.user.uid;
    let fileName = 'Uploaded_Resume.txt';
    let fileSize = 0;
    let resumeText = '';

    const contentType = req.headers.get('content-type') || '';

    // Handle Multipart Form Data
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No file uploaded under key "file".' }, { status: 400, headers });
      }
      fileName = file.name;
      fileSize = file.size;
      resumeText = await file.text();
    } else {
      // Handle JSON payload
      const body = await req.json();
      fileName = body.fileName || 'Uploaded_Resume.txt';
      resumeText = body.resumeText || '';
      fileSize = Buffer.byteLength(resumeText);
    }

    if (!resumeText.trim()) {
      return NextResponse.json({ error: 'Resume text content is empty or invalid.' }, { status: 400, headers });
    }

    // 2. Instantiate and persist the raw resume report in Firestore with a pending/processing state
    const reportId = `rep_${Math.random().toString(36).substring(2, 11)}`;
    const pendingReport: ResumeReportDocument = {
      reportId,
      userId,
      fileName: sanitizeInput(fileName),
      fileSize,
      storagePath: `resumes/${userId}/${reportId}.txt`,
      uploadedAt: serverTimestamp() as any,
      analysisStatus: 'pending'
    };

    await ResumeRepository.save(pendingReport);

    return NextResponse.json({
      success: true,
      message: 'Resume uploaded successfully.',
      reportId,
      report: pendingReport,
      resumeText // Return the text so client can trigger /analyze with same payload or custom targets
    }, { status: 201, headers });

  } catch (error: any) {
    console.error('API [RESUME_UPLOAD] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error occurred.' },
      { status: 500, headers }
    );
  }
}
