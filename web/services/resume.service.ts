import { ResumeRepository } from '@/repositories/resume.repository';
import { LLMFactory } from '@/ai/factory';
import { ResumeReportDocument, ResumeAIAnalysis } from '@/types/database';
import { serverTimestamp } from 'firebase/firestore';

export class ResumeService {
  /**
   * Processes the uploaded resume text, invokes Gemini for deep technical review, and saves the final scorecard report.
   */
  static async analyzeResume(
    userId: string,
    fileName: string,
    fileSize: number,
    resumeText: string,
    targetRole = 'Senior Software Engineer'
  ): Promise<ResumeReportDocument> {
    const reportId = `rep_${Math.random().toString(36).substring(2, 11)}`;
    const provider = LLMFactory.createProvider('gemini');

    const systemInstruction = `You are an expert executive Technical Recruiter and Resume Optimizer.
Analyze the provided resume text against the target role: "${targetRole}".
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

    let analysisResults: ResumeAIAnalysis;
    try {
      const response = await provider.generateCompletion(prompt, 'gemini-3.5-flash', {
        responseFormat: 'json',
        systemInstruction,
        temperature: 0.15
      });

      const text = response.text.trim();
      const cleanJson = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      analysisResults = JSON.parse(cleanJson) as ResumeAIAnalysis;
    } catch (apiError: any) {
      console.error('[ResumeService Gemini API Error]:', apiError);
      throw new Error(`Failed to analyze resume via Gemini: ${apiError.message}`);
    }

    const report: ResumeReportDocument = {
      reportId,
      userId,
      fileName,
      fileSize,
      storagePath: `resumes/${userId}/${reportId}.txt`,
      uploadedAt: serverTimestamp() as any,
      analysisStatus: 'completed',
      analysisResults
    };

    await ResumeRepository.save(report);
    return report;
  }

  /**
   * Retrieves a single report for a user
   */
  static async getReport(reportId: string, userId: string): Promise<ResumeReportDocument | null> {
    const report = await ResumeRepository.getById(reportId);
    if (!report) return null;
    if (report.userId !== userId) {
      throw new Error('Unauthorized access to this resume report.');
    }
    return report;
  }

  /**
   * Retrieves all reports for a specific user
   */
  static async listReports(userId: string): Promise<ResumeReportDocument[]> {
    return ResumeRepository.getByUserId(userId);
  }

  /**
   * Securely deletes a resume report after verifying ownership
   */
  static async deleteReport(reportId: string, userId: string): Promise<void> {
    const report = await ResumeRepository.getById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }
    if (report.userId !== userId) {
      throw new Error('Unauthorized deletion attempt.');
    }
    await ResumeRepository.delete(reportId);
  }
}
