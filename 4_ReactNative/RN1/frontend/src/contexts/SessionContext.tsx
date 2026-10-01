import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import { tokenStore } from '../services/tokenStore';
import type { Session, User } from '../types';

type SessionState = {
  user: User | null;
  loading: boolean;
  signIn: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
};
const Context = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Una sesión guardada se valida contra el servidor antes de mostrar bienvenida.
    tokenStore.get().then(async (token) => {
      if (token) {
        try { setUser((await api.me(token)).user); }
        catch { await tokenStore.remove(); }
      }
    }).finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (session: Session) => {
    await tokenStore.set(session.token);
    setUser(session.user);
  }, []);
  const signOut = useCallback(async () => {
    await tokenStore.remove();
    setUser(null);
  }, []);

  return <Context.Provider value={{ user, loading, signIn, signOut }}>{children}</Context.Provider>;
}

export function useSession() {
  const context = useContext(Context);
  if (!context) throw new Error('useSession requiere SessionProvider');
  return context;
}
