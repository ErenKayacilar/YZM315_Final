import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Config } from '@/constants/Config';

export default function LoginScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];
    const isDark = colorScheme === 'dark';

    const { login, loginWithBiometrics, isBiometricAvailable, enableBiometrics } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasBiometricCredentials, setHasBiometricCredentials] = useState(false);

    // Check if biometric credentials are stored
    useEffect(() => {
        const checkBiometricCredentials = async () => {
            const biometricData = await SecureStore.getItemAsync(Config.BIOMETRIC_KEY);
            setHasBiometricCredentials(!!biometricData);
        };
        checkBiometricCredentials();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            setError(t('auth.loginFailed'));
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await login(email, password);

            // Ask to enable biometrics after successful login
            if (isBiometricAvailable && !hasBiometricCredentials) {
                Alert.alert(
                    t('auth.biometricLogin'),
                    'Bir sonraki giriş için biyometrik kimlik doğrulamayı etkinleştirmek ister misiniz?',
                    [
                        { text: t('common.no'), style: 'cancel' },
                        {
                            text: t('common.yes'),
                            onPress: () => enableBiometrics(email, password)
                        },
                    ]
                );
            }
        } catch (err: any) {
            setError(err.message || t('auth.loginFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleBiometricLogin = async () => {
        setIsLoading(true);
        setError('');

        try {
            await loginWithBiometrics();
        } catch (err: any) {
            if (err.message === 'No biometric credentials stored') {
                setError(t('auth.biometricNotEnrolled'));
            } else {
                setError(err.message || t('auth.loginFailed'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Background gradient orbs */}
            <View style={styles.backgroundOrbs}>
                <LinearGradient
                    colors={isDark ? ['rgba(99, 102, 241, 0.2)', 'transparent'] : ['rgba(99, 102, 241, 0.1)', 'transparent']}
                    style={[styles.orb, styles.orbTop]}
                />
                <LinearGradient
                    colors={isDark ? ['rgba(59, 130, 246, 0.2)', 'transparent'] : ['rgba(59, 130, 246, 0.1)', 'transparent']}
                    style={[styles.orb, styles.orbBottom]}
                />
            </View>

            {/* Login Card */}
            <View style={[styles.card, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)', borderColor: colors.border }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.tint }]}>
                        {t('header.title')}
                    </Text>
                    <Text style={[styles.subtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        {t('auth.loginTitle')}
                    </Text>
                </View>

                {/* Error Message */}
                {error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={20} color="#ef4444" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                {/* Email Input */}
                <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                        {t('auth.email')}
                    </Text>
                    <TextInput
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.inputBg,
                                borderColor: colors.inputBorder,
                                color: colors.text,
                            },
                        ]}
                        placeholder="example@email.com"
                        placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                        {t('auth.password')}
                    </Text>
                    <TextInput
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.inputBg,
                                borderColor: colors.inputBorder,
                                color: colors.text,
                            },
                        ]}
                        placeholder="********"
                        placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                {/* Login Button */}
                <TouchableOpacity
                    onPress={handleLogin}
                    disabled={isLoading}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#6366f1', '#3b82f6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.loginButton}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text style={styles.loginButtonText}>{t('auth.loginButton')}</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                {/* Biometric Login Button */}
                {isBiometricAvailable && hasBiometricCredentials && (
                    <TouchableOpacity
                        onPress={handleBiometricLogin}
                        disabled={isLoading}
                        style={[styles.biometricButton, { borderColor: colors.tint }]}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="finger-print" size={24} color={colors.tint} />
                        <Text style={[styles.biometricButtonText, { color: colors.tint }]}>
                            {t('auth.biometricLogin')}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Register Link */}
                <TouchableOpacity
                    style={styles.registerLink}
                    onPress={() => router.push('/(auth)/register' as any)}
                >
                    <Text style={[styles.registerLinkText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        Hesabınız yok mu?{' '}
                        <Text style={{ color: '#22c55e', fontWeight: '600' }}>Kayıt Ol</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    backgroundOrbs: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
    },
    orb: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
    },
    orbTop: {
        top: '10%',
        left: '10%',
    },
    orbBottom: {
        bottom: '10%',
        right: '10%',
    },
    card: {
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
    },
    subtitle: {
        fontSize: 16,
        marginTop: 8,
        fontWeight: '500',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    errorText: {
        color: '#ef4444',
        marginLeft: 8,
        fontSize: 14,
        flex: 1,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
    },
    loginButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    loginButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
        marginTop: 16,
    },
    biometricButtonText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    registerLink: {
        marginTop: 20,
        alignItems: 'center',
    },
    registerLinkText: {
        fontSize: 14,
    },
});
