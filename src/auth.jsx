import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken } from './api.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { setLoading(false); return; }
    api('/auth/me').then((d) => setUser(d.user)).catch(() => setToken(null)).finally(() => setLoading(false));
    const onLogout = () => setUser(null);
    window.addEventListener('sp-logout', onLogout);
    return () => window.removeEventListener('sp-logout', onLogout);
  }, []);

  const login = useCallback((token, u, remember = true) => { setToken(token, remember); setUser(u); }, []);
  const logout = useCallback(() => { setToken(null); setUser(null); }, []);

  return <AuthCtx.Provider value={{ user, setUser, loading, login, logout, isHead: user?.role === 'sales_head' }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
