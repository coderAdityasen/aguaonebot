import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  username: string;
  role: 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false }),
  logout: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('aguaone_token'));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Configure Axios authorization header
  const configureAxios = (authToken: string | null) => {
    if (authToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('aguaone_token');
      if (storedToken) {
        configureAxios(storedToken);
        try {
          const res = await axios.get('/api/auth/me');
          if (res.data?.authenticated) {
            setUser(res.data.user);
            setToken(storedToken);
          } else {
            logout();
          }
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await axios.post('/api/auth/login', { username, password });
      if (res.data?.success && res.data?.token) {
        const authToken = res.data.token;
        const authUser = res.data.user;

        localStorage.setItem('aguaone_token', authToken);
        configureAxios(authToken);
        setToken(authToken);
        setUser(authUser);
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || 'Invalid username or password'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('aguaone_token');
    configureAxios(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
