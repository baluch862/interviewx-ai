import { NextRequest, NextResponse } from 'next/server';
import { LLMFactory } from '@/ai/factory';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      action, 
      role, 
      company, 
      interviewType, 
      conversationHistory = [], 
      resumeText = '', 
      currentDifficulty = 'senior' 
    } = body;

    if (!action) {
      return NextResponse.json({ error: 'Missing required parameter: action' }, { status: 400 });
    }

    const provider = LLMFactory.createProvider('gemini');

    // 1. ACTION: GENERATE FIRST QUESTION
    if (action === 'generate_first') {
      const systemInstruction = `You are an elite, senior principal Recruiter and Director of Engineering conducting a professional mock interview.
Evaluate the background details carefully and formulate the perfect introductory question.
The question must target:
- Role: "${role}"
- Company: "${company}"
- Interview Mode: "${interviewType}"
- Selected Candidate Resume context: ${resumeText ? `"${resumeText}"` : 'No custom resume uploaded.'}

Keep the question direct, realistic, open-ended, and matching a ${currentDifficulty}-level standard. 
Avoid any markup formatting like asterisks or bold text. Return ONLY the plain text of the question.`;

      const prompt = `Generate a starting question for an interview for the role of ${role} at ${company} under the ${interviewType} category.`;

      try {
        const response = await provider.generateCompletion(prompt, 'gemini-3.5-flash', {
          systemInstruction,
          temperature: 0.7
        });

        return NextResponse.json({
          question: response.text.trim(),
          difficulty: currentDifficulty
        });
      } catch (err: any) {
        return NextResponse.json({ error: 'Failed to generate first question: ' + err.message }, { status: 502 });
      }
    }

    // 2. ACTION: SUBMIT ANSWER (Live evaluation & dynamic next question)
    if (action === 'submit_answer') {
      if (conversationHistory.length === 0) {
        return NextResponse.json({ error: 'No conversation history provided' }, { status: 400 });
      }

      const lastTurn = conversationHistory[conversationHistory.length - 1];
      if (lastTurn.role !== 'user') {
        return NextResponse.json({ error: 'Last message in history must be from user' }, { status: 400 });
      }

      const systemInstruction = `You are a world-class Executive Recruiter and Engineering Lead.
Analyze the candidate's last answer in the context of the entire interview conversation history, candidate's resume (if provided), target company, and role.

Perform "Recruiter Thinking" internally:
- Evaluate the answer's technical depth, confidence level, clarity, and communication skills.
- Check for previous answers, missing details, and logical consistency. Do not repeat questions or let the candidate bypass hard topics.
- Adjust the interview difficulty dynamically: if the candidate answered correctly and demonstrated high technical depth, increase the difficulty of the next question. If they struggled, lower the difficulty or offer a polite guiding hint.
- Determine if the candidate's response has any technical hand-waving or gaps, and construct an intelligent, sharp follow-up or cross-question (e.g. if they say "I used Firebase", cross-question with "Why Firebase? How would you scale database listeners under high writes?").

You must return a raw JSON object matching this strict schema:
{
  "recruiterThoughts": "Detailed recruiter evaluation of the last response, including strengths and specific gaps identified",
  "liveMetrics": {
    "technicalScore": number (0-100),
    "communicationScore": number (0-100),
    "confidenceScore": number (0-100),
    "overallRating": number (0-100)
  },
  "nextDifficulty": "junior" | "mid" | "senior" | "staff",
  "nextQuestion": "The text of the next dynamic follow-up or cross-question. Keep it conversational, sharp, and highly professional without any markdown bold or italic highlights."
}

Do not wrap in markdown \`\`\`json. Return pure raw JSON only. Ensure scoring is realistic and rigorous.`;

      const prompt = `
Role: "${role}"
Company: "${company}"
Interview Mode: "${interviewType}"
Current Difficulty: "${currentDifficulty}"
Candidate Resume Context: ${resumeText ? `"${resumeText}"` : 'No custom resume uploaded.'}

Full Conversation History:
${JSON.stringify(conversationHistory, null, 2)}

Evaluate the last response, update the metrics, and construct the perfect next question.`;

      try {
        const response = await provider.generateCompletion(prompt, 'gemini-3.5-flash', {
          responseFormat: 'json',
          systemInstruction,
          temperature: 0.6
        });

        const text = response.text.trim();
        const cleanJson = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        const payload = JSON.parse(cleanJson);

        return NextResponse.json(payload);
      } catch (err: any) {
        console.error('Gemini error during answer submission:', err);
        return NextResponse.json({ error: 'Failed to analyze answer: ' + err.message }, { status: 502 });
      }
    }

    // 3. ACTION: GENERATE REPORT
    if (action === 'generate_report') {
      const systemInstruction = `You are a Principal Engineering Director and Elite Executive Recruiter.
Analyze the complete multi-turn interview conversation history and draft a stunning, comprehensive executive evaluation report.

You must return a raw JSON object matching this strict schema:
{
  "recruiterSummary": "A highly detailed, professional evaluation paragraph analyzing the candidate's core architectural approach, behavioral storytelling style, soft skill level, and system mastery.",
  "strengths": string[],
  "weakAreas": string[],
  "missedConcepts": string[],
  "learningRoadmap": string[],
  "hiringRecommendation": "Strong Hire" | "Hire" | "No Hire" | "Leaning No Hire",
  "interviewReadinessPercentage": number (0-100)
}

Do not wrap in markdown \`\`\`json. Return pure raw JSON only. Write extremely helpful, specific feedback pointing to modern architecture patterns, optimization techniques, or soft skills.`;

      const prompt = `
Role: "${role}"
Company: "${company}"
Interview Mode: "${interviewType}"
Candidate Resume Context: ${resumeText ? `"${resumeText}"` : 'No custom resume uploaded.'}

Complete Conversation History:
${JSON.stringify(conversationHistory, null, 2)}

Draft the final executive scorecard and learning roadmap.`;

      try {
        const response = await provider.generateCompletion(prompt, 'gemini-3.5-flash', {
          responseFormat: 'json',
          systemInstruction,
          temperature: 0.4
        });

        const text = response.text.trim();
        const cleanJson = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        const report = JSON.parse(cleanJson);

        return NextResponse.json({ report });
      } catch (err: any) {
        return NextResponse.json({ error: 'Failed to compile report: ' + err.message }, { status: 502 });
      }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error: any) {
    console.error('API [INTEVIEW_INTELLIGENCE] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error occurred' },
      { status: 500 }
    );
  }
}
