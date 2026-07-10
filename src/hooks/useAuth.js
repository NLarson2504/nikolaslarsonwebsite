import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { isAdmin } from '../lib/adminAuth';

/**
 * Subscribes to Firebase auth state. Returns { user, admin, loading } where
 * `admin` is true only for allowlisted admin emails.
 */
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { user, admin: isAdmin(user), loading };
};

export default useAuth;
