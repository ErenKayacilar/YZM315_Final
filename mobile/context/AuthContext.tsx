import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import axios, { AxiosInstance } from 'axios';
import { Config } from '../constants/Config';
import { User, Role } from '../types';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isBiometricAvailable: boolean;
    login: (email: string, password: string) => Promise<void>;
    loginWithBiometrics: () => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    enableBiometrics: (email: string, password: string) => Promise<void>;
    api: AxiosInstance;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create axios instance
const api = axios.create({
    baseURL: Config.API_URL,
});

// Add token to requests
api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync(Config.TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export { api };

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

    // Check biometric availability and stored token on mount
    useEffect(() => {
        const initialize = async () => {
            try {
                // Check biometric availability
                const compatible = await LocalAuthentication.hasHardwareAsync();
                const enrolled = await LocalAuthentication.isEnrolledAsync();
                setIsBiometricAvailable(compatible && enrolled);

                // Check for stored token and user
                const token = await SecureStore.getItemAsync(Config.TOKEN_KEY);
                const userData = await SecureStore.getItemAsync(Config.USER_KEY);

                if (token && userData) {
                    setUser(JSON.parse(userData));
                }
            } catch (error) {
                console.error('Initialization error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initialize();
    }, []);

    // Login with email and password
    const login = async (email: string, password: string) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user: userData } = response.data;

            // Store token and user data securely
            await SecureStore.setItemAsync(Config.TOKEN_KEY, token);
            await SecureStore.setItemAsync(Config.USER_KEY, JSON.stringify(userData));

            setUser(userData);
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    };

    // Enable biometrics - stores credentials for future biometric login
    const enableBiometrics = async (email: string, password: string) => {
        try {
            // Authenticate with biometrics first
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Biyometrik kimlik doğrulama',
                cancelLabel: 'İptal',
                fallbackLabel: 'Şifre Kullan',
            });

            if (result.success) {
                // Store credentials securely for biometric login
                await SecureStore.setItemAsync(Config.BIOMETRIC_KEY, JSON.stringify({ email, password }));
            } else {
                throw new Error('Biometric authentication failed');
            }
        } catch (error) {
            throw error;
        }
    };

    // Login with biometrics
    const loginWithBiometrics = async () => {
        try {
            // Check if biometric credentials are stored
            const biometricData = await SecureStore.getItemAsync(Config.BIOMETRIC_KEY);
            if (!biometricData) {
                throw new Error('No biometric credentials stored');
            }

            // Authenticate with biometrics
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Giriş yapmak için kimliğinizi doğrulayın',
                cancelLabel: 'İptal',
                fallbackLabel: 'Şifre Kullan',
            });

            if (result.success) {
                const { email, password } = JSON.parse(biometricData);
                await login(email, password);
            } else {
                throw new Error('Biometric authentication cancelled');
            }
        } catch (error) {
            throw error;
        }
    };

    // Logout
    const logout = async () => {
        try {
            await SecureStore.deleteItemAsync(Config.TOKEN_KEY);
            await SecureStore.deleteItemAsync(Config.USER_KEY);
            // Note: We keep biometric credentials so user can log in again with biometrics
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const refreshUser = async () => {
        try {
            const res = await api.get('/users/profile');
            const userData = res.data;
            await SecureStore.setItemAsync(Config.USER_KEY, JSON.stringify(userData));
            setUser(userData);
        } catch (error) {
            console.log('Failed to refresh user:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isBiometricAvailable,
                login,
                loginWithBiometrics,
                logout,
                refreshUser,
                enableBiometrics,
                api,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
