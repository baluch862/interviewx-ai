/**
 * InterviewX AI Firestore Database Schema & TypeScript Interfaces
 * 
 * This file defines the enterprise-grade schema structure for Google Firebase Firestore.
 * It provides strict, production-ready TypeScript types and interfaces representing
 * both root-level collections and nested subcollections.
 * 
 * ==========================================
 * FIRESTORE HIERARCHY MAP:
 * ==========================================
 * 
 * /users/{userId} [Document]
 * 
 * /resumeReports/{reportId} [Document]
 * 
 * /interviewSessions/{sessionId} [Document]
 *    ├── /questions/{questionId} [Subcollection Document]
 *    └── /answers/{answerId} [Subcollection Document]
 * 
 */

// ==========================================
// 1. COMMON TYPES
// ==========================================

export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export type SubscriptionPlan = 'free' | 'tier_pro' | 'tier_enterprise';

export type SessionStatus = 'configured' | 'active' | 'completed' | 'terminated';

export type QuestionCategory = 'technical' | 'behavioral' | 'system_design' | 'situational';

export type DifficultyLevel = 'entry' | 'mid' | 'senior' | 'staff_principal';


// ==========================================
// 2. USER SCHEMA
// ==========================================

export interface UserSubscription {
  plan: SubscriptionPlan;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid';
  currentPeriodStart: FirestoreTimestamp | Date;
  currentPeriodEnd: FirestoreTimestamp | Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface UserStats {
  totalSessionsCount: number;
  completedSessionsCount: number;
  averageScore: number;
  streakCount: number;
  lastActiveDate: FirestoreTimestamp | Date | null;
}

export interface UserProfile {
  displayName: string;
  avatarUrl: string | null;
  targetRole?: string;
  targetDifficulty?: DifficultyLevel;
  experienceYears?: number;
  preferredLanguages?: string[];
}

/**
 * Represented in the root collection: `/users/{userId}`
 */
export interface UserDocument {
  uid: string;
  email: string;
  createdAt: FirestoreTimestamp | Date;
  updatedAt: FirestoreTimestamp | Date;
  profile: UserProfile;
  stats: UserStats;
  subscription: UserSubscription;
  securityEnclaveAgreed: boolean;
  onboardingCompleted: boolean;
}


// ==========================================
// 3. RESUME REPORTS SCHEMA
// ==========================================

export interface ResumeSkillAnalysis {
  detectedSkills: string[];
  missingCriticalSkills: string[];
  recommendedToAcquire: string[];
}

export interface SectionFeedback {
  sectionName: string;
  score: number; // 0 - 100
  strengths: string[];
  weaknesses: string[];
  improvementSuggestions: string[];
}

export interface ResumeAIAnalysis {
  overallScore: number; // 0 - 100
  summary: string;
  formattingScore: number; // 0 - 100
  impactBulletPointsScore: number; // 0 - 100
  skillGapAnalysis: ResumeSkillAnalysis;
  sectionFeedback: SectionFeedback[];
  tailoredTargetRoles: string[];
}

/**
 * Represented in the root collection: `/resumeReports/{reportId}`
 */
export interface ResumeReportDocument {
  reportId: string;
  userId: string; // Foreign Key referencing `/users/{userId}`
  fileName: string;
  fileSize: number; // in bytes
  storagePath: string; // Firebase Storage location path
  uploadedAt: FirestoreTimestamp | Date;
  analysisStatus: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  analysisResults?: ResumeAIAnalysis;
}


// ==========================================
// 4. INTERVIEW SESSIONS SCHEMA
// ==========================================

export interface InterviewConfig {
  roleTitle: string;
  companyName: string;
  difficulty: DifficultyLevel;
  questionCount: number;
  categories: QuestionCategory[];
  voiceEnabled: boolean;
  voiceModelId?: string;
  customJobDescription?: string;
}

export interface SessionMetrics {
  overallScore: number; // 0 - 100
  technicalDepthScore?: number; // 0 - 100
  behavioralScore?: number; // 0 - 100
  communicationScore?: number; // 0 - 100
  problemSolvingScore?: number; // 0 - 100
  deliverySpeedWordPerMin?: number;
  fillerWordCount?: number;
}

/**
 * Represented in the root collection: `/interviewSessions/{sessionId}`
 */
export interface InterviewSessionDocument {
  sessionId: string;
  userId: string; // Foreign Key referencing `/users/{userId}`
  status: SessionStatus;
  config: InterviewConfig;
  metrics?: SessionMetrics;
  executiveSummary?: string;
  keyStrengths?: string[];
  growthAreas?: string[];
  createdAt: FirestoreTimestamp | Date;
  startedAt?: FirestoreTimestamp | Date;
  completedAt?: FirestoreTimestamp | Date;
}


// ==========================================
// 5. NESTED SUBCOLLECTIONS UNDER INTERVIEW SESSIONS
// ==========================================

/**
 * Represented in nested subcollection: `/interviewSessions/{sessionId}/questions/{questionId}`
 */
export interface InterviewQuestionDocument {
  questionId: string;
  sessionId: string; // Parent Session reference
  orderIndex: number; // 1-indexed sort field
  text: string;
  category: QuestionCategory;
  estimatedDurationSeconds: number;
  idealAnswerRubric: {
    pointsToCover: string[];
    technicalKeywords: string[];
    behavioralTriggers?: string[];
  };
  createdAt: FirestoreTimestamp | Date;
}

export interface RubricEvaluation {
  criteriaName: string;
  score: number; // 0 - 100
  observation: string;
}

export interface AnswerFeedback {
  overallScore: number; // 0 - 100
  modelResponseComparison: string; // AI generated ideal comparison
  strengths: string[];
  gaps: string[];
  rubricScores: RubricEvaluation[];
  suggestedActionItems: string[];
}

/**
 * Represented in nested subcollection: `/interviewSessions/{sessionId}/answers/{answerId}`
 */
export interface InterviewAnswerDocument {
  answerId: string;
  sessionId: string; // Parent Session reference
  questionId: string; // Linked Question reference
  userId: string; // Security boundary fallback
  rawTranscript: string; // Transcribed or input text
  audioDurationMs?: number; // Voice length if voice input was used
  audioUrl?: string; // Firebase Storage audio backup URL
  submittedAt: FirestoreTimestamp | Date;
  evaluationStatus: 'pending' | 'analyzing' | 'completed' | 'failed';
  feedback?: AnswerFeedback;
}
