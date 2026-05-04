import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api, AuthUser } from "../services/api";

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isBootstrapping: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);
const STORAGE_TOKEN_KEY = "classpulse.token";

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      try {
        const savedToken = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);

        if (!savedToken) {
          return;
        }

        const response = await api.getMe(savedToken);
        setToken(savedToken);
        setUser(response.user);
      } catch (_error) {
        await AsyncStorage.removeItem(STORAGE_TOKEN_KEY);
      } finally {
        setIsBootstrapping(false);
      }
    }

    bootstrap();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      isBootstrapping,
      async signIn(email: string, password: string) {
        const response = await api.login(email, password);
        await AsyncStorage.setItem(STORAGE_TOKEN_KEY, response.accessToken);
        setToken(response.accessToken);
        setUser(response.user);
      },
      async signOut() {
        await AsyncStorage.removeItem(STORAGE_TOKEN_KEY);
        setToken(null);
        setUser(null);
      },
    }),
    [isBootstrapping, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
