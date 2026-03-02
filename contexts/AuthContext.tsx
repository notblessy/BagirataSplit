import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";
import { BagirataApiService } from "../services/BagirataApiService";
import { User } from "../types";

const TOKEN_KEY = "auth_token";

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  token: string | null;
  isLoading: boolean;
  errorMessage: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  updateProfile: (updates: { name?: string; avatar?: string }) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Restore token on mount
  useEffect(() => {
    restoreToken();
  }, []);

  const restoreToken = async () => {
    try {
      const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      if (savedToken) {
        setToken(savedToken);
        setIsAuthenticated(true);
        // Fetch user profile to validate token
        try {
          const response = await BagirataApiService.getMe();
          if (response.success && response.data) {
            setCurrentUser(response.data);
          } else {
            // Token invalid
            await doLogout();
          }
        } catch {
          // Token expired or invalid
          await doLogout();
        }
      }
    } catch (error) {
      console.error("Error restoring token:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const response = await BagirataApiService.login(email, password);
      if (response.success && response.data) {
        const { token: newToken, user } = response.data;
        await SecureStore.setItemAsync(TOKEN_KEY, newToken);
        setToken(newToken);
        setCurrentUser(user);
        setIsAuthenticated(true);
        return true;
      }
      setErrorMessage(response.message || "Login failed");
      return false;
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Login failed";
      setErrorMessage(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const response = await BagirataApiService.register(name, email, password);
      if (response.success && response.data) {
        const { token: newToken, user } = response.data;
        await SecureStore.setItemAsync(TOKEN_KEY, newToken);
        setToken(newToken);
        setCurrentUser(user);
        setIsAuthenticated(true);
        return true;
      }
      setErrorMessage(response.message || "Registration failed");
      return false;
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Registration failed";
      setErrorMessage(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const doLogout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const logout = async () => {
    setIsLoading(true);
    await doLogout();
    setIsLoading(false);
  };

  const fetchUserProfile = async () => {
    if (!token) return;
    try {
      const response = await BagirataApiService.getMe();
      if (response.success && response.data) {
        setCurrentUser(response.data);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const updateProfile = async (updates: { name?: string; avatar?: string }): Promise<boolean> => {
    try {
      const response = await BagirataApiService.updateMe(updates);
      if (response.success && response.data) {
        setCurrentUser(response.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating profile:", error);
      return false;
    }
  };

  const deleteAccount = async (): Promise<boolean> => {
    try {
      const response = await BagirataApiService.deleteMe();
      if (response.success) {
        await doLogout();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting account:", error);
      return false;
    }
  };

  const clearError = () => setErrorMessage(null);

  const value: AuthContextType = {
    isAuthenticated,
    currentUser,
    token,
    isLoading,
    errorMessage,
    login,
    register,
    logout,
    fetchUserProfile,
    updateProfile,
    deleteAccount,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
