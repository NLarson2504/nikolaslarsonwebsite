import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Admin access control. Only these emails may write to Firestore. This is the
 * client-side gate for the admin UI; the authoritative check is the matching
 * Firestore security rule (firestore.rules) — the UI check is convenience, the
 * rule is what actually protects the data.
 */
export const ADMIN_EMAILS = ['nickolars123@gmail.com'];

export const isAdmin = (user) =>
  Boolean(user && user.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));

const provider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, provider);

export const signOut = () => fbSignOut(auth);
