import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { LLMFactory } from '@/ai/factory';
import { validateAuthToken, checkRateLimit, getSecurityHeaders } from '@/lib/backend-utils';

// Helper for security headers
function createHeaders() {
  return getSecurityHeaders();
}

// 1. GET: Fetch reports for a specific user
export async function GET(req: NextRequest) {
  try {
    const headers = createHeaders();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const reportId = searchParams.get('reportId');

    // Authentication validation
    const session = await validateAuthToken(req);
    // If authenticated, we verify ownership, otherwise fall back to parameter for demo
    const activeUserId = session?.uid || userId;

    if (!activeUserId) {
      return NextResponse.json({ error: 'Missing required query parameter: userId' }, { status: 400, headers });
    }

    if (reportId) {
      // Fetch single report details
      const reportSnap = await getDoc(doc(db, 'resumeReports', reportId));
      if (!reportSnap.exists()) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404, headers });
      }
      const data = reportSnap.data();
      if (data.userId !== activeUserId) {
        return NextResponse.json({ error: 'Unauthorized access to this report' }, { status: 403, headers });
      }
      return NextResponse.json({ success: true, report: data }, { status: 200, headers });
    }

    // Fetch all reports for the user
    const reportsQuery = query(
      collection(db, 'resumeReports'),
      where('userId', '==', activeUserId),
      orderBy('uploadedAt', 'desc')
    );

    const reportsSnap = await getDocs(reportsQuery);
    const reports: any[] = [];
    reportsSnap.forEach(snap => {
      reports.push(snap.data());
    });

    return NextResponse.json({ success: true, reports }, { status: 200, headers });

  } catch (error: any) {
    console.error('API [RESUME GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500, headers: createHeaders() }
    );
  }
}

// 2. POST: Parse and Analyze Resume via Gemini AI Model
export async function POST(req: NextRequest) {
  const headers = createHeaders();
  try {
    // Rate limit check
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const limitCheck = checkRateLimit(ip);
    if (!limitCheck.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers });
    }

    const body = await req.json();
    const { userId, fileName, resumeText, targetRole } = body;

    const session = await validateAuthToken(req);
    const activeUserId = session?.uid || userId;

    if (!activeUserId || !resumeText) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and resumeText' },
        { status: 400, headers }
      );
    }

    const reportId = `report_${Math.random().toString(36).substring(2, 11)}`;
    const provider = LLMFactory.createProvider('gemini');

    const systemInstruction = `You are an expert executive Technical Recruiter and Resume Optimizer.
Analyze the provided resume text against the target role: "${targetRole || 'Senior Software Engineer'}".
You must return a raw JSON object matching this strict typescript schema:
{
  "overallScore": number (0-100),
  "summary": "brief summary of resume fit",
  "formattingScore": number (0-100),
  "impactBulletPointsScore": number (0-100),
  "skillGapAnalysis": {
    "detectedSkills": string[],
    "missingCriticalSkills": string[],
    "recommendedToAcquire": string[]
  },
  "sectionFeedback": [
    {
      "sectionName": "string",
      "score": number (0-100),
      "strengths": string[],
      "weaknesses": string[],
      "improvementSuggestions": string[]
    }
  ],
  "tailoredTargetRoles": string[]
}
Do not wrap your output in markdown formatting like \`\`\`json. Return pure raw JSON only.`;

    const prompt = `Resume Text:
${resumeText}

Analyze this resume and provide detailed feedback.`;

    let analysisResults: any;
    try {
      const response = await provider.generateCompletion(prompt, 'gemini-3.5-flash', {
        responseFormat: 'json',
        systemInstruction,
        temperature: 0.2
      });

      const text = response.text.trim();
      const cleanJson = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      analysisResults = JSON.parse(cleanJson);
    } catch (apiError: any) {
      console.error('Gemini API Error in Resume Analysis:', apiError);
      return NextResponse.json(
        { error: 'Failed to analyze resume via Gemini API: ' + apiError.message },
        { status: 502, headers }
      );
    }

    const report = {
      reportId,
      userId: activeUserId,
      fileName: fileName || 'Uploaded_Resume.txt',
      fileSize: Buffer.byteLength(resumeText),
      storagePath: `resumes/${activeUserId}/${reportId}.txt`,
      uploadedAt: serverTimestamp(),
      analysisStatus: 'completed',
      analysisResults
    };

    await setDoc(doc(db, 'resumeReports', reportId), report);

    return NextResponse.json({
      success: true,
      message: 'Resume analyzed successfully',
      reportId,
      report
    }, { status: 200, headers });

  } catch (error: any) {
    console.error('API [RESUME POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error occurred' },
      { status: 500, headers }
    );
  }
}

// 3. DELETE: Remove resume report from Firestore
export async function DELETE(req: NextRequest) {
  const headers = createHeaders();
  try {
    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get('reportId');

    if (!reportId) {
      return NextResponse.json({ error: 'Missing required query parameter: reportId' }, { status: 400, headers });
    }

    const reportDocRef = doc(db, 'resumeReports', reportId);
    const reportSnap = await getDoc(reportDocRef);

    if (!reportSnap.exists()) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404, headers });
    }

    const reportData = reportSnap.data();

    // Verification check via auth headers
    const session = await validateAuthToken(req);
    if (session && reportData.userId !== session.uid && session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized to delete this report' }, { status: 403, headers });
    }

    await deleteDoc(reportDocRef);

    return NextResponse.json({
      success: true,
      message: 'Resume report deleted successfully',
      reportId
    }, { status: 200, headers });

  } catch (error: any) {
    console.error('API [RESUME DELETE] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500, headers }
    );
  }
}
