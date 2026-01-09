import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authService from '../services/authService';
import { STORAGE_KEYS } from '../utils/constants';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);

          // Verify token is still valid by fetching current user
          try {
            const response = await authService.getCurrentUser();
            if (response.success && response.data?.user) {
              setUser(response.data.user);
              localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.user));
            }
          } catch (error) {
            // Token invalid, clear auth
            clearAuth();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Clear authentication state
  const clearAuth = useCallback(() => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.PERMISSIONS);
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      const response = await authService.login(email, password);

      if (response.success && response.data) {
        const { token: newToken, user: userData } = response.data;

        setToken(newToken);
        setUser(userData);
        setIsAuthenticated(true);

        localStorage.setItem(STORAGE_KEYS.TOKEN, newToken);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));

        toast.success(response.message || 'Login successful');
        return { success: true, user: userData };
      }

      throw new Error(response.message || 'Login failed');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Call logout API if token exists
      if (token) {
        await authService.logout();
      }
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with logout even if API call fails
    } finally {
      clearAuth();
      toast.success('Logged out successfully');
      navigate('/');
    }
  }, [token, clearAuth, navigate]);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    try {
      const response = await authService.refreshToken();
      if (response.success && response.data?.token) {
        const newToken = response.data.token;
        setToken(newToken);
        localStorage.setItem(STORAGE_KEYS.TOKEN, newToken);
        return newToken;
      }
      throw new Error('Token refresh failed');
    } catch (error) {
      console.error('Token refresh error:', error);
      clearAuth();
      navigate('/');
      throw error;
    }
  }, [clearAuth, navigate]);

  // Get current user function
  const getCurrentUser = useCallback(async () => {
    try {
      const response = await authService.getCurrentUser();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.user));
        return response.data.user;
      }
      throw new Error('Failed to get current user');
    } catch (error) {
      console.error('Get current user error:', error);
      if (error.response?.status === 401) {
        clearAuth();
        navigate('/');
      }
      throw error;
    }
  }, [clearAuth, navigate]);

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    logout,
    refreshToken,
    getCurrentUser,
    setUser, // Allow updating user from other contexts
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

