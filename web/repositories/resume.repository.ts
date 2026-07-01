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
import { ResumeReportDocument } from '@/types/database';

export class ResumeRepository {
  private static collectionName = 'resumeReports';

  /**
   * Retrieves a resume report by its unique ID
   */
  static async getById(reportId: string): Promise<ResumeReportDocument | null> {
    const docRef = doc(db, this.collectionName, reportId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as ResumeReportDocument;
  }

  /**
   * Saves or updates a resume report document
   */
  static async save(report: ResumeReportDocument): Promise<void> {
    const docRef = doc(db, this.collectionName, report.reportId);
    // Standardize uploadedAt as serverTimestamp if it's new, otherwise keep existing
    const payload = {
      ...report,
      updatedAt: serverTimestamp()
    };
    await setDoc(docRef, payload, { merge: true });
  }

  /**
   * Retrieves all resume reports belonging to a specific user
   */
  static async getByUserId(userId: string): Promise<ResumeReportDocument[]> {
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
      orderBy('uploadedAt', 'desc')
    );
    const snap = await getDocs(q);
    const reports: ResumeReportDocument[] = [];
    snap.forEach((docSnap) => {
      reports.push(docSnap.data() as ResumeReportDocument);
    });
    return reports;
  }

  /**
   * Deletes a resume report from firestore
   */
  static async delete(reportId: string): Promise<void> {
    const docRef = doc(db, this.collectionName, reportId);
    await deleteDoc(docRef);
  }
}
