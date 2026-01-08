import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity } from 'react-native';

import Colors from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';

export default function InstructorLayout() {
    const { isDark } = useTheme();
    const { t } = useTranslation();
    const router = useRouter();
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
                    title: t('dashboard.myCourses'),
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
                name="requests"
                options={{
                    title: t('course.requests'),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people" size={size} color={color} />
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
            <Tabs.Screen name="courses" options={{ href: null }} />
            <Tabs.Screen name="course/[id]" options={{ href: null }} />
            <Tabs.Screen name="course/[id]/notes" options={{ href: null }} />
            <Tabs.Screen name="course/[id]/create-exam" options={{ href: null }} />
            <Tabs.Screen name="course/[id]/create-lesson" options={{ href: null }} />
        </Tabs>
    );
}
