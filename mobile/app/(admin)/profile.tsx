import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import i18n from '@/i18n/i18n';
import { Config } from '@/constants/Config';

export default function AdminProfileScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const { theme, setTheme, isDark } = useTheme();
    const colors = Colors[isDark ? 'dark' : 'light'];

    const handleLogout = () => {
        Alert.alert(
            t('header.logout'),
            'Çıkış yapmak istediğinize emin misiniz?',
            [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('common.confirm'), onPress: logout, style: 'destructive' },
            ]
        );
    };

    const toggleLanguage = async () => {
        const newLang = i18n.language === 'tr' ? 'en' : 'tr';
        await AsyncStorage.setItem('user-language', newLang);
        i18n.changeLanguage(newLang);
    };

    const handleThemeChange = () => {
        Alert.alert(
            'Görünüm',
            'Uygulama temasını seçiniz',
            [
                {
                    text: 'Sistem (Otomatik)',
                    onPress: () => setTheme('system'),
                    style: theme === 'system' ? 'default' : 'cancel'
                },
                {
                    text: 'Aydınlık Mod (Light)',
                    onPress: () => setTheme('light'),
                    style: theme === 'light' ? 'default' : 'cancel'
                },
                {
                    text: 'Karanlık Mod (Dark)',
                    onPress: () => setTheme('dark'),
                    style: theme === 'dark' ? 'default' : 'cancel'
                },
                { text: 'İptal', style: 'cancel' }
            ]
        );
    };

    const renderMenuItem = (
        icon: keyof typeof Ionicons.glyphMap,
        title: string,
        onPress: () => void,
        isDestructive = false
    ) => (
        <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.7}
            onPress={onPress}
        >
            <View style={[styles.menuIcon, { backgroundColor: isDestructive ? 'rgba(239, 68, 68, 0.1)' : `${colors.tint}20` }]}>
                <Ionicons name={icon} size={22} color={isDestructive ? '#ef4444' : colors.tint} />
            </View>
            <Text style={[styles.menuTitle, { color: isDestructive ? '#ef4444' : colors.text }]}>
                {title}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#64748b' : '#94a3b8'} />
        </TouchableOpacity>
    );

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.content}
        >
            {/* Profile Header */}
            <View
                style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
                <View style={[styles.avatar, { backgroundColor: `${colors.tint}20` }]}>
                    {user?.profileImage ? (
                        <Image
                            source={{ uri: user.profileImage }}
                            style={{ width: 80, height: 80, borderRadius: 40 }}
                        />
                    ) : (
                        <Text style={[styles.avatarText, { color: colors.tint }]}>
                            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                        </Text>
                    )}
                </View>
                <Text style={[styles.userName, { color: colors.text }]}>
                    {user?.name || 'Admin'}
                </Text>
                <Text style={[styles.userEmail, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    {user?.email}
                </Text>
                <View style={[styles.roleBadge, { backgroundColor: `${colors.tint}20` }]}>
                    <Text style={[styles.roleText, { color: colors.tint }]}>
                        {user?.role}
                    </Text>
                </View>
            </View>

            {/* Menu Items */}
            <View style={styles.menuSection}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    {t('sidebar.settings')}
                </Text>

                {renderMenuItem(
                    'moon',
                    `Görünüm: ${theme === 'system' ? 'Otomatik' : theme === 'dark' ? 'Karanlık' : 'Aydınlık'}`,
                    handleThemeChange
                )}

                {renderMenuItem(
                    'language',
                    `${t('common.filter')}: ${i18n.language === 'tr' ? 'Türkçe' : 'English'}`,
                    toggleLanguage
                )}
            </View>

            <View style={styles.menuSection}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    {t('common.actions')}
                </Text>

                {renderMenuItem('log-out', t('header.logout'), handleLogout, true)}
            </View>

            <View style={styles.versionContainer}>
                <Text style={[styles.versionText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                    Versiyon {Config.VERSION}
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    profileCard: {
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        marginBottom: 24,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: '700',
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
    },
    userEmail: {
        fontSize: 14,
        marginTop: 4,
    },
    roleBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 12,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '600',
    },
    menuSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
    },
    menuIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    versionContainer: {
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    versionText: {
        fontSize: 12,
    },
});
