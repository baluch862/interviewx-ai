import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDocs, setDoc, updateDoc, collection, serverTimestamp, getDoc } from 'firebase/firestore';
import { LLMFactory } from '@/ai/factory';
import { ReportDocument, AnswerDocument, InterviewQuestionDocument, InterviewSessionDocument } from '@/types/database';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, userId } = body;

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: sessionId and userId' },
        { status: 400 }
      );
    }

    const reportId = `report_session_${Math.random().toString(36).substring(2, 11)}`;

    // 1. Fetch all questions and answers from Firestore subcollections
    const questionsSnap = await getDocs(collection(db, 'interviewSessions', sessionId, 'questions'));
    const answersSnap = await getDocs(collection(db, 'interviewSessions', sessionId, 'answers'));

    const questions: InterviewQuestionDocument[] = [];
    questionsSnap.forEach(docSnap => {
      questions.push(docSnap.data() as InterviewQuestionDocument);
    });

    const answers: AnswerDocument[] = [];
    answersSnap.forEach(docSnap => {
      answers.push(docSnap.data() as AnswerDocument);
    });

    if (answers.length === 0) {
      return NextResponse.json(
        { error: 'No answers submitted for this session yet' },
        { status: 400 }
      );
    }

    // 2. Compute average stats across answers
    let totalComm = 0, totalTech = 0, totalConfidence = 0, totalClarity = 0, totalGrammar = 0, totalProblemSolving = 0, totalOverall = 0;
    
    answers.forEach(ans => {
      const evalData = ans.aiEvaluation;
      if (evalData) {
        totalComm += evalData.scoreCommunication || 0;
        totalTech += evalData.scoreTechnicalKnowledge || 0;
        totalConfidence += evalData.scoreConfidence || 0;
        totalClarity += evalData.scoreClarity || 0;
        totalGrammar += evalData.scoreGrammar || 0;
        totalProblemSolving += evalData.scoreProblemSolving || 0;
        totalOverall += evalData.overallAnswerScore || 0;
      }
    });

    const count = answers.length;
    const avgComm = Math.round(totalComm / count);
    const avgTech = Math.round(totalTech / count);
    const avgConfidence = Math.round(totalConfidence / count);
    const avgClarity = Math.round(totalClarity / count);
    const avgGrammar = Math.round(totalGrammar / count);
    const avgProblemSolving = Math.round(totalProblemSolving / count);
    const avgOverall = Math.round(totalOverall / count);

    // 3. Compile dialogue transcript for Gemini Synthesis
    const dialogueList = answers.map(ans => {
      const q = questions.find(qst => qst.questionId === ans.questionId);
      return {
        question: q ? q.text : 'Unknown Question',
        category: q ? q.category : 'technical',
        answer: ans.userAnswerText,
        evaluation: ans.aiEvaluation
      };
    });

    // 4. Generate beautiful Executive Summary report via Gemini
    const provider = LLMFactory.createProvider('gemini');

    const systemInstruction = `You are an elite Staff Recruiter, Executive Talent Coach, and Engineering Director.
Generate a comprehensive, high-level technical assessment report based on the provided interview dialogue session and metrics.
Analyze strengths, structural code gaps, design weaknesses, and specify concrete roadmaps.
You must return only raw JSON matching this strict schema:
{
  "executiveSummary": "Detailed summary paragraph analyzing the candidate's core design capabilities and soft skill readiness",
  "strengthsList": string[],
  "growthAreasList": string[],
  "detailedSectionGrades": [
    {
      "categoryName": "technical" | "behavioral" | "system_design" | "situational",
      "score": number,
      "feedback": "constructive category-specific breakdown"
    }
  ],
  "roadmapRecommendations": string[]
}
Do not wrap in markdown \`\`\`json. Return pure raw JSON only. Ensure the feedback is extremely actionable, highlighting precise systems or topics (like Redis cluster limits, CAP theorem, lock-free threads, etc.).`;

    const prompt = `
Dialogue Transcript and Evaluation Data:
${JSON.stringify(dialogueList, null, 2)}

Provide the final aggregated summary report.`;

    let reportPayload: {
      executiveSummary: string;
      strengthsList: string[];
      growthAreasList: string[];
      detailedSectionGrades: Array<{ categoryName: any; score: number; feedback: string }>;
      roadmapRecommendations: string[];
    };

    try {
      const response = await provider.generateCompletion(prompt, 'gemini-3.5-flash', {
        responseFormat: 'json',
        systemInstruction,
        temperature: 0.3
      });

      const text = response.text.trim();
      const cleanJson = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      reportPayload = JSON.parse(cleanJson);
    } catch (apiError: any) {
      console.error('Gemini API Error in Report Synthesis:', apiError);
      return NextResponse.json(
        { error: 'Failed to synthesize report via Gemini API: ' + apiError.message },
        { status: 502 }
      );
    }

    // 5. Store Report Document
    const reportDoc: Omit<ReportDocument, 'createdAt'> & { createdAt: any } = {
      reportId,
      sessionId,
      userId,
      overallScore: avgOverall,
      averageCommunicationScore: avgComm,
      averageTechnicalScore: avgTech,
      executiveSummary: reportPayload.executiveSummary,
      strengthsList: reportPayload.strengthsList,
      growthAreasList: reportPayload.growthAreasList,
      detailedSectionGrades: reportPayload.detailedSectionGrades,
      roadmapRecommendations: reportPayload.roadmapRecommendations,
      createdAt: serverTimestamp()
    };

    await setDoc(doc(db, 'reports', reportId), reportDoc);

    // 6. Update parent session document with completion metrics and status
    const metrics = {
      communicationScore: avgComm,
      technicalScore: avgTech,
      confidenceScore: avgConfidence,
      clarityScore: avgClarity,
      grammarScore: avgGrammar,
      problemSolvingScore: avgProblemSolving,
      overallSessionScore: avgOverall
    };

    await updateDoc(doc(db, 'interviewSessions', sessionId), {
      status: 'completed',
      completedAt: serverTimestamp(),
      metrics,
      executiveSummary: reportPayload.executiveSummary,
      keyStrengths: reportPayload.strengthsList,
      growthAreas: reportPayload.growthAreasList
    });

    // 7. Update User profile aggregates if document exists
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const totalSessions = (userData.stats?.totalSessionsCount || 0) + 1;
      const completedSessions = (userData.stats?.completedSessionsCount || 0) + 1;
      const prevAvg = userData.stats?.averageScore || 0;
      const newAvg = Math.round(((prevAvg * (completedSessions - 1)) + avgOverall) / completedSessions);

      await updateDoc(userRef, {
        'stats.totalSessionsCount': totalSessions,
        'stats.completedSessionsCount': completedSessions,
        'stats.averageScore': newAvg,
        'stats.lastActiveDate': serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    // 8. Log Progress entry for analytics charts
    const progressId = `progress_${Math.random().toString(36).substring(2, 11)}`;
    await setDoc(doc(db, 'progress', progressId), {
      progressId,
      userId,
      sessionId,
      overallScore: avgOverall,
      metrics,
      completedAt: serverTimestamp()
    });

    return NextResponse.json({
      message: 'Interview session completed and report generated successfully',
      reportId,
      report: reportDoc
    });

  } catch (error: any) {
    console.error('API [INTERVIEW_REPORT] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error occurred' },
      { status: 500 }
    );
  }
}
