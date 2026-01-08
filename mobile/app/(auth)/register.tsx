import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import axios from 'axios';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Config } from '@/constants/Config';

export default function RegisterScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];
    const isDark = colorScheme === 'dark';

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<'STUDENT' | 'INSTRUCTOR'>('STUDENT');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleRegister = async () => {
        setError('');

        // Validation
        if (!name || !email || !password) {
            setError('Lütfen tüm alanları doldurun.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Şifreler eşleşmiyor.');
            return;
        }

        if (password.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır.');
            return;
        }

        setIsLoading(true);

        try {
            await axios.post(`${Config.API_URL}/auth/register`, {
                name,
                email,
                password,
                role
            });

            setSuccess(true);
            setTimeout(() => {
                router.replace('/login');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Kayıt başarısız oldu.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.successCard, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)' }]}>
                    <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
                    <Text style={[styles.successTitle, { color: colors.text }]}>Hesap Oluşturuldu!</Text>
                    <Text style={[styles.successText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        Giriş sayfasına yönlendiriliyorsunuz...
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Background gradient orbs */}
            <View style={styles.backgroundOrbs}>
                <LinearGradient
                    colors={isDark ? ['rgba(34, 197, 94, 0.2)', 'transparent'] : ['rgba(34, 197, 94, 0.1)', 'transparent']}
                    style={[styles.orb, styles.orbTop]}
                />
                <LinearGradient
                    colors={isDark ? ['rgba(59, 130, 246, 0.2)', 'transparent'] : ['rgba(59, 130, 246, 0.1)', 'transparent']}
                    style={[styles.orb, styles.orbBottom]}
                />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Register Card */}
                <View style={[styles.card, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)', borderColor: colors.border }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: '#22c55e' }]}>
                            Hesap Oluştur
                        </Text>
                        <Text style={[styles.subtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                            Platforma katılmak için kayıt olun
                        </Text>
                    </View>

                    {/* Error Message */}
                    {error ? (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={20} color="#ef4444" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {/* Name Input */}
                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                            Ad Soyad
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
                            placeholder="Adınız Soyadınız"
                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                        />
                    </View>

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

                    {/* Confirm Password Input */}
                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                            Şifre Tekrar
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
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />
                    </View>

                    {/* Role Selector */}
                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                            Hesap Türü
                        </Text>
                        <View style={styles.roleContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.roleButton,
                                    role === 'STUDENT' && styles.roleButtonActive,
                                    { borderColor: role === 'STUDENT' ? '#22c55e' : colors.border }
                                ]}
                                onPress={() => setRole('STUDENT')}
                            >
                                <Ionicons
                                    name="school"
                                    size={20}
                                    color={role === 'STUDENT' ? '#22c55e' : isDark ? '#94a3b8' : '#64748b'}
                                />
                                <Text style={[
                                    styles.roleText,
                                    { color: role === 'STUDENT' ? '#22c55e' : isDark ? '#94a3b8' : '#64748b' }
                                ]}>
                                    Öğrenci
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.roleButton,
                                    role === 'INSTRUCTOR' && styles.roleButtonActive,
                                    { borderColor: role === 'INSTRUCTOR' ? '#22c55e' : colors.border }
                                ]}
                                onPress={() => setRole('INSTRUCTOR')}
                            >
                                <Ionicons
                                    name="person"
                                    size={20}
                                    color={role === 'INSTRUCTOR' ? '#22c55e' : isDark ? '#94a3b8' : '#64748b'}
                                />
                                <Text style={[
                                    styles.roleText,
                                    { color: role === 'INSTRUCTOR' ? '#22c55e' : isDark ? '#94a3b8' : '#64748b' }
                                ]}>
                                    Eğitmen
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Register Button */}
                    <TouchableOpacity
                        onPress={handleRegister}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#22c55e', '#16a34a']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.registerButton}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text style={styles.registerButtonText}>Kayıt Ol</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Login Link */}
                    <TouchableOpacity
                        style={styles.loginLink}
                        onPress={() => router.replace('/login')}
                    >
                        <Text style={[styles.loginLinkText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                            Zaten hesabınız var mı?{' '}
                            <Text style={{ color: colors.tint, fontWeight: '600' }}>Giriş Yap</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
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
        top: '5%',
        right: '10%',
    },
    orbBottom: {
        bottom: '10%',
        left: '10%',
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
        textAlign: 'center',
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
    roleContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    roleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
        gap: 8,
    },
    roleButtonActive: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
    },
    roleText: {
        fontSize: 14,
        fontWeight: '600',
    },
    registerButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#22c55e',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    registerButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    loginLink: {
        marginTop: 20,
        alignItems: 'center',
    },
    loginLinkText: {
        fontSize: 14,
    },
    successCard: {
        margin: 20,
        padding: 40,
        borderRadius: 20,
        alignItems: 'center',
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginTop: 16,
    },
    successText: {
        fontSize: 16,
        marginTop: 8,
        textAlign: 'center',
    },
});
