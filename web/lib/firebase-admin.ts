import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import * as crypto from 'crypto';

// Secret key for custom secure session tokens (in production, loaded from environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'interviewx-ai-jwt-secret-key-32-chars-long!';

export interface AdminUserRecord {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export class FirebaseAdmin {
  // Signs a highly secure custom JSON Web Token
  static signToken(payload: Record<string, any>, expiresInSeconds = 86400): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const fullPayload = {
      ...payload,
      iat: now,
      exp: now + expiresInSeconds
    };

    const base64UrlEncode = (obj: Record<string, any>) => {
      const str = JSON.stringify(obj);
      return Buffer.from(str).toString('base64url');
    };

    const headerEncoded = base64UrlEncode(header);
    const payloadEncoded = base64UrlEncode(fullPayload);

    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${headerEncoded}.${payloadEncoded}`)
      .digest('base64url');

    return `${headerEncoded}.${payloadEncoded}.${signature}`;
  }

  // Verifies the custom JWT token
  static verifyToken(token: string): Record<string, any> | null {
    try {
      const [headerEncoded, payloadEncoded, signature] = token.split('.');
      if (!headerEncoded || !payloadEncoded || !signature) {
        return null;
      }

      // Re-sign to verify signature matches
      const expectedSignature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${headerEncoded}.${payloadEncoded}`)
        .digest('base64url');

      if (signature !== expectedSignature) {
        return null;
      }

      const payload = JSON.parse(Buffer.from(payloadEncoded, 'base64').toString('utf8'));
      const now = Math.floor(Date.now() / 1000);

      if (payload.exp && now > payload.exp) {
        return null; // Expired
      }

      return payload;
    } catch (e) {
      console.error('[FirebaseAdmin verifyToken Error]:', e);
      return null;
    }
  }

  // Manages/Authenticates users using securely matched credentials
  static async verifyIdToken(token: string): Promise<AdminUserRecord | null> {
    const payload = this.verifyToken(token);
    if (!payload) return null;

    return {
      uid: payload.uid,
      email: payload.email,
      displayName: payload.displayName,
      photoURL: payload.photoURL
    };
  }

  // Helper to retrieve user metadata securely from Firestore
  static async getUser(uid: string): Promise<AdminUserRecord | null> {
    try {
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (!userSnap.exists()) return null;
      const data = userSnap.data();
      return {
        uid: data.uid,
        email: data.email,
        displayName: data.profile?.displayName,
        photoURL: data.profile?.avatarUrl
      };
    } catch (error) {
      console.error('[FirebaseAdmin getUser Error]:', error);
      return null;
    }
  }
}
