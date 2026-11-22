import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!getToken());

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setReady(true);
      return null;
    }
    try {
      const profile = await api('/me');
      setUser(profile);
      return profile;
    } catch {
      setToken(null);
      setUser(null);
      return null;
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const acceptToken = useCallback(async (token) => {
    setToken(token);
    const profile = await refresh();
    return profile;
  }, [refresh]);

  const login = useCallback(async (credentials) => {
    const data = await api('/login', { method: 'POST', body: credentials });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await api('/register', { method: 'POST', body: payload });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/logout', { method: 'POST' });
    } finally {
      setToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, register, logout, refresh, acceptToken }),
    [user, ready, login, register, logout, refresh, acceptToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
