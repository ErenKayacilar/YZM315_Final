import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import Colors from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';

export default function StudentLayout() {
    const { isDark } = useTheme();
    const { t } = useTranslation();
    const colors = Colors[isDark ? 'dark' : 'light'];

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: colors.tint,
                tabBarInactiveTintColor: colors.tabIconDefault,
                tabBarStyle: {
                    backgroundColor: colors.card,
                    borderTopColor: colors.border,
                },
                headerStyle: {
                    backgroundColor: colors.card,
                },
                headerTintColor: colors.text,
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: t('tabs.dashboard'),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="courses"
                options={{
                    title: t('tabs.courses'),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="book" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="exams"
                options={{
                    title: t('sidebar.exams'),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="document-text" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: t('tabs.profile'),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />
            {/* Hide dynamic routes from tab bar */}
            <Tabs.Screen name="course/[id]" options={{ href: null }} />
            <Tabs.Screen name="course/[id]/notes" options={{ href: null }} />
            <Tabs.Screen name="exam/[id]" options={{ href: null }} />
        </Tabs>
    );
}
