import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/inv.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('inv_user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('inv_token') || null);

  useEffect(() => {
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    else delete api.defaults.headers.common['Authorization'];
  }, [token]);

  const login = async (username, password) => {
    const { data } = await api.post('api/auth/login', { username, password });
    localStorage.setItem('inv_token', data.token);
    localStorage.setItem('inv_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('inv_token');
    localStorage.removeItem('inv_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
