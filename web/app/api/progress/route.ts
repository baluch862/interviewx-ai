import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required query parameter: userId' },
        { status: 400 }
      );
    }

    // 1. Fetch user stats for general counts & streaks
    const userSnap = await getDoc(doc(db, 'users', userId));
    const userStats = userSnap.exists() ? userSnap.data().stats : null;

    // 2. Fetch history of progress entries
    const progressQuery = query(
      collection(db, 'progress'),
      where('userId', '==', userId),
      orderBy('completedAt', 'desc'),
      limit(20)
    );

    const progressSnap = await getDocs(progressQuery);
    const history: any[] = [];
    progressSnap.forEach(docSnap => {
      history.push(docSnap.data());
    });

    // 3. Aggregate historical metrics
    let totalComm = 0, totalTech = 0, totalConfidence = 0, totalClarity = 0, totalProblemSolving = 0, totalOverall = 0;
    const scoresTimeline: any[] = [];

    history.forEach(p => {
      const m = p.metrics;
      if (m) {
        totalComm += m.communicationScore || 0;
        totalTech += m.technicalScore || 0;
        totalConfidence += m.confidenceScore || 0;
        totalClarity += m.clarityScore || 0;
        totalProblemSolving += m.problemSolvingScore || 0;
        totalOverall += p.overallScore || 0;
      }
      scoresTimeline.push({
        date: p.completedAt ? new Date(p.completedAt.seconds * 1000).toISOString().split('T')[0] : 'N/A',
        score: p.overallScore || 0
      });
    });

    const count = history.length;
    const aggregatedSkills = {
      communication: count > 0 ? Math.round(totalComm / count) : 0,
      technicalKnowledge: count > 0 ? Math.round(totalTech / count) : 0,
      confidence: count > 0 ? Math.round(totalConfidence / count) : 0,
      clarity: count > 0 ? Math.round(totalClarity / count) : 0,
      problemSolving: count > 0 ? Math.round(totalProblemSolving / count) : 0
    };

    // 4. Calculate weighted engineering readiness score
    // 40% Technical, 30% Problem Solving, 15% Clarity, 15% Communication
    const readinessScore = count > 0
      ? Math.round(
          (aggregatedSkills.technicalKnowledge * 0.4) +
          (aggregatedSkills.problemSolving * 0.3) +
          (aggregatedSkills.clarity * 0.15) +
          (aggregatedSkills.communication * 0.15)
        )
      : 0;

    return NextResponse.json({
      userId,
      readinessScore,
      aggregatedSkills,
      timeline: scoresTimeline.reverse(), // chronologically ordered
      stats: {
        completedCount: userStats?.completedSessionsCount || count,
        totalCount: userStats?.totalSessionsCount || count,
        streakCount: userStats?.streakCount || 0,
        averageOverallScore: userStats?.averageScore || (count > 0 ? Math.round(totalOverall / count) : 0)
      },
      rawHistory: history
    });

  } catch (error: any) {
    console.error('API [PROGRESS] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error occurred' },
      { status: 500 }
    );
  }
}
