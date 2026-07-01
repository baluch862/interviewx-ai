import { db } from '@/lib/firebase';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import {
  InterviewSessionDocument,
  InterviewQuestionDocument,
  InterviewAnswerDocument
} from '@/types/database';

export class InterviewRepository {
  private static sessionsCollection = 'interviewSessions';

  /**
   * Retrieves an interview session by its unique ID
   */
  static async getSessionById(sessionId: string): Promise<InterviewSessionDocument | null> {
    const docRef = doc(db, this.sessionsCollection, sessionId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as InterviewSessionDocument;
  }

  /**
   * Saves or updates an interview session document
   */
  static async saveSession(session: InterviewSessionDocument): Promise<void> {
    const docRef = doc(db, this.sessionsCollection, session.sessionId);
    await setDoc(docRef, {
      ...session,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  /**
   * Saves a question under a session's nested subcollection
   */
  static async saveQuestion(question: InterviewQuestionDocument): Promise<void> {
    const docRef = doc(
      db,
      this.sessionsCollection,
      question.sessionId,
      'questions',
      question.questionId
    );
    await setDoc(docRef, question);
  }

  /**
   * Retrieves all questions under a session ordered by index
   */
  static async getQuestions(sessionId: string): Promise<InterviewQuestionDocument[]> {
    const colRef = collection(db, this.sessionsCollection, sessionId, 'questions');
    const q = query(colRef, orderBy('orderIndex', 'asc'));
    const snap = await getDocs(q);
    const questions: InterviewQuestionDocument[] = [];
    snap.forEach((docSnap) => {
      questions.push(docSnap.data() as InterviewQuestionDocument);
    });
    return questions;
  }

  /**
   * Saves an answer under a session's nested subcollection
   */
  static async saveAnswer(answer: InterviewAnswerDocument): Promise<void> {
    const docRef = doc(
      db,
      this.sessionsCollection,
      answer.sessionId,
      'answers',
      answer.answerId
    );
    await setDoc(docRef, answer);
  }

  /**
   * Retrieves all answers under a session ordered by submittedAt
   */
  static async getAnswers(sessionId: string): Promise<InterviewAnswerDocument[]> {
    const colRef = collection(db, this.sessionsCollection, sessionId, 'answers');
    const q = query(colRef, orderBy('submittedAt', 'asc'));
    const snap = await getDocs(q);
    const answers: InterviewAnswerDocument[] = [];
    snap.forEach((docSnap) => {
      answers.push(docSnap.data() as InterviewAnswerDocument);
    });
    return answers;
  }

  /**
   * Finds a specific answer for a question in a session
   */
  static async getAnswerByQuestionId(
    sessionId: string,
    questionId: string
  ): Promise<InterviewAnswerDocument | null> {
    const colRef = collection(db, this.sessionsCollection, sessionId, 'answers');
    const q = query(colRef, where('questionId', '==', questionId));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as InterviewAnswerDocument;
  }

  /**
   * Retrieves all sessions for a specific user
   */
  static async getSessionsByUserId(userId: string): Promise<InterviewSessionDocument[]> {
    const q = query(
      collection(db, this.sessionsCollection),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    const sessions: InterviewSessionDocument[] = [];
    snap.forEach((docSnap) => {
      sessions.push(docSnap.data() as InterviewSessionDocument);
    });
    return sessions;
  }
}
