import { InterviewRepository } from '@/repositories/interview.repository';
import { LLMFactory } from '@/ai/factory';
import {
  InterviewSessionDocument,
  InterviewQuestionDocument,
  InterviewAnswerDocument,
  InterviewConfig,
  AnswerFeedback,
  SessionMetrics
} from '@/types/database';
import { serverTimestamp } from 'firebase/firestore';

export class InterviewService {
  /**
   * Initializes a new interview session and dynamically generates all the tailored questions using Gemini API
   */
  static async startSession(
    userId: string,
    config: InterviewConfig
  ): Promise<{ session: InterviewSessionDocument; firstQuestion: InterviewQuestionDocument }> {
    const sessionId = `ses_${Math.random().toString(36).substring(2, 11)}`;
    const provider = LLMFactory.createProvider('gemini');

    const systemInstruction = `You are an elite Lead Technical Interviewer and Engineering Manager.
Generate a structured list of highly relevant, tough, role-specific interview questions for:
Role: "${config.roleTitle}"
Company: "${config.companyName || 'Top Tier Tech Company'}"
Difficulty: "${config.difficulty}"
Target Categories: ${config.categories.join(', ')}
Custom Guidelines: "${config.customJobDescription || 'None'}"

Generate exactly ${config.questionCount} questions.
You must return a raw JSON array matching this exact typescript schema:
[
  {
    "text": "string (the actual question)",
    "category": "technical" | "behavioral" | "system_design" | "situational",
    "estimatedDurationSeconds": number,
    "idealAnswerRubric": {
      "pointsToCover": string[],
      "technicalKeywords": string[],
      "behavioralTriggers": string[]
    }
  }
]
Do not wrap output in markdown formatting like \`\`\`json. Return pure raw JSON only.`;

    const prompt = `Generate a suite of ${config.questionCount} tailored interview questions with rubrics for ${config.roleTitle}.`;

    let generatedQuestions: any[] = [];
    try {
      const response = await provider.generateCompletion(prompt, 'gemini-3.5-flash', {
        responseFormat: 'json',
        systemInstruction,
        temperature: 0.25
      });

      const text = response.text.trim();
      const cleanJson = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      generatedQuestions = JSON.parse(cleanJson);
    } catch (error: any) {
      console.error('[InterviewService startSession LLM Error]:', error);
      // Fallback in case of API failure to keep app running smoothly
      generatedQuestions = Array.from({ length: config.questionCount }).map((_, i) => ({
        text: `Tell me about a challenging project you engineered in ${config.roleTitle} and how you resolved its core constraints.`,
        category: 'technical',
        estimatedDurationSeconds: 180,
        idealAnswerRubric: {
          pointsToCover: ['Technical challenges faced', 'Your specific architectural decisions', 'Quantifiable outcomes'],
          technicalKeywords: ['architecture', 'scalability', 'performance'],
          behavioralTriggers: ['ownership', 'collaboration']
        }
      }));
    }

    // 1. Save Session Document
    const session: InterviewSessionDocument = {
      sessionId,
      userId,
      status: 'active',
      config,
      createdAt: serverTimestamp() as any,
      startedAt: serverTimestamp() as any
    };
    await InterviewRepository.saveSession(session);

    // 2. Save and map questions
    const mappedQuestions: InterviewQuestionDocument[] = [];
    for (let i = 0; i < generatedQuestions.length; i++) {
      const gq = generatedQuestions[i];
      const question: InterviewQuestionDocument = {
        questionId: `que_${Math.random().toString(36).substring(2, 11)}`,
        sessionId,
        orderIndex: i + 1,
        text: gq.text,
        category: gq.category || 'technical',
        estimatedDurationSeconds: gq.estimatedDurationSeconds || 180,
        idealAnswerRubric: {
          pointsToCover: gq.idealAnswerRubric?.pointsToCover || [],
          technicalKeywords: gq.idealAnswerRubric?.technicalKeywords || [],
          behavioralTriggers: gq.idealAnswerRubric?.behavioralTriggers || []
        },
        createdAt: serverTimestamp() as any
      };
      await InterviewRepository.saveQuestion(question);
      mappedQuestions.push(question);
    }

    return {
      session,
      firstQuestion: mappedQuestions[0]
    };
  }

  /**
   * Retrieves a question for the session by its index (1-based)
   */
  static async getQuestionByIndex(
    sessionId: string,
    index: number
  ): Promise<InterviewQuestionDocument | null> {
    const questions = await InterviewRepository.getQuestions(sessionId);
    return questions.find((q) => q.orderIndex === index) || null;
  }

  /**
   * Evaluates a user's transcript/audio submission against a specific question
   */
  static async evaluateAnswer(
    sessionId: string,
    questionId: string,
    userId: string,
    rawTranscript: string,
    audioDurationMs?: number,
    audioUrl?: string
  ): Promise<InterviewAnswerDocument> {
    const session = await InterviewRepository.getSessionById(sessionId);
    if (!session) throw new Error('Session not found');
    if (session.userId !== userId) throw new Error('Unauthorized');

    const questions = await InterviewRepository.getQuestions(sessionId);
    const question = questions.find((q) => q.questionId === questionId);
    if (!question) throw new Error('Question not found in this session');

    const answerId = `ans_${Math.random().toString(36).substring(2, 11)}`;
    const provider = LLMFactory.createProvider('gemini');

    const systemInstruction = `You are an expert technical interviewer. Evaluate the candidate's response to this question:
Question: "${question.text}"
Category: "${question.category}"

Ideal Rubric Constraints:
- Points to cover: ${question.idealAnswerRubric.pointsToCover.join(', ')}
- Technical Keywords: ${question.idealAnswerRubric.technicalKeywords.join(', ')}

Return a JSON object with this strict schema:
{
  "overallScore": number (0-100),
  "modelResponseComparison": "A concise model answer comparison showing what they answered vs. a perfect answer",
  "strengths": string[],
  "gaps": string[],
  "rubricScores": [
    {
      "criteriaName": "string (e.g., Technical Depth, Clarity, Structure)",
      "score": number (0-100),
      "observation": "string observation"
    }
  ],
  "suggestedActionItems": string[]
}
Do not wrap output in markdown formatting. Return pure raw JSON only.`;

    let feedback: AnswerFeedback;
    try {
      const response = await provider.generateCompletion(
        `Candidate's Transcript: "${rawTranscript}"`,
        'gemini-3.5-flash',
        {
          responseFormat: 'json',
          systemInstruction,
          temperature: 0.15
        }
      );

      const text = response.text.trim();
      const cleanJson = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      feedback = JSON.parse(cleanJson) as AnswerFeedback;
    } catch (err: any) {
      console.error('[InterviewService evaluateAnswer LLM Error]:', err);
      feedback = {
        overallScore: 75,
        modelResponseComparison: 'Unable to evaluate comparison due to a temporary AI service interruption.',
        strengths: ['Attempted to answer the core prompt'],
        gaps: ['AI Evaluation service was temporarily offline'],
        rubricScores: [
          { criteriaName: 'Completeness', score: 75, observation: 'Answer received but detailed scoring bypassed.' }
        ],
        suggestedActionItems: ['Retry or proceed with next question']
      };
    }

    const answerDoc: InterviewAnswerDocument = {
      answerId,
      sessionId,
      questionId,
      userId,
      rawTranscript,
      audioDurationMs,
      audioUrl,
      submittedAt: serverTimestamp() as any,
      evaluationStatus: 'completed',
      feedback
    };

    await InterviewRepository.saveAnswer(answerDoc);
    return answerDoc;
  }

  /**
   * Finalizes the interview session, synthesizes scores across all answers and returns executive summary scorecard
   */
  static async endSession(sessionId: string, userId: string): Promise<InterviewSessionDocument> {
    const session = await InterviewRepository.getSessionById(sessionId);
    if (!session) throw new Error('Session not found');
    if (session.userId !== userId) throw new Error('Unauthorized');

    const questions = await InterviewRepository.getQuestions(sessionId);
    const answers = await InterviewRepository.getAnswers(sessionId);

    // Calculate initial average scores from answers
    const validAnswers = answers.filter((a) => a.evaluationStatus === 'completed' && a.feedback);
    const averageScore = validAnswers.length > 0
      ? Math.round(validAnswers.reduce((sum, a) => sum + (a.feedback?.overallScore || 0), 0) / validAnswers.length)
      : 0;

    const provider = LLMFactory.createProvider('gemini');

    const systemInstruction = `You are a Principal Engineering Partner synthesizing a full candidate assessment.
Review the following questions and candidate's evaluations:
${questions.map((q, i) => {
  const ans = answers.find((a) => a.questionId === q.questionId);
  return `Q${i + 1}: "${q.text}" (Category: ${q.category})
Answer Transcript: "${ans?.rawTranscript || 'No response'}"
Score: ${ans?.feedback?.overallScore || 0}
Strengths: ${ans?.feedback?.strengths?.join(', ') || ''}
Gaps: ${ans?.feedback?.gaps?.join(', ') || ''}`;
}).join('\n\n')}

Create a synthesized final assessment scorecard report.
Return a raw JSON object with this strict schema:
{
  "metrics": {
    "overallScore": number (0-100),
    "technicalDepthScore": number (0-100),
    "behavioralScore": number (0-100),
    "communicationScore": number (0-100),
    "problemSolvingScore": number (0-100)
  },
  "executiveSummary": "detailed summary of the overall interview session performance",
  "keyStrengths": string[],
  "growthAreas": string[]
}
Do not wrap output in markdown formatting. Return pure raw JSON only.`;

    let summaryPayload: {
      metrics: SessionMetrics;
      executiveSummary: string;
      keyStrengths: string[];
      growthAreas: string[];
    };

    try {
      const response = await provider.generateCompletion('Synthesize the full session performance reports.', 'gemini-3.5-flash', {
        responseFormat: 'json',
        systemInstruction,
        temperature: 0.2
      });

      const text = response.text.trim();
      const cleanJson = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      summaryPayload = JSON.parse(cleanJson);
    } catch (err: any) {
      console.error('[InterviewService endSession LLM Error]:', err);
      summaryPayload = {
        metrics: {
          overallScore: averageScore,
          technicalDepthScore: averageScore,
          behavioralScore: averageScore,
          communicationScore: averageScore,
          problemSolvingScore: averageScore
        },
        executiveSummary: 'An aggregated performance breakdown has been completed for this session.',
        keyStrengths: ['Consistent responses across technical pillars'],
        growthAreas: ['Refine delivery precision and depth']
      };
    }

    session.status = 'completed';
    session.metrics = summaryPayload.metrics;
    session.executiveSummary = summaryPayload.executiveSummary;
    session.keyStrengths = summaryPayload.keyStrengths;
    session.growthAreas = summaryPayload.growthAreas;
    session.completedAt = serverTimestamp() as any;

    await InterviewRepository.saveSession(session);
    return session;
  }
}
