import { Tabs } from 'expo-router';
import React from 'react';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

function TabBarIcon(props: {
    name: React.ComponentProps<typeof Ionicons>['name'];
    color: string;
}) {
    return <Ionicons size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function AdminLayout() {
    const colorScheme = useColorScheme();
    const { t } = useTranslation();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                headerShown: false,
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Panel',
                    tabBarIcon: ({ color }) => <TabBarIcon name="stats-chart" color={color} />,
                }}
            />
            <Tabs.Screen
                name="approvals"
                options={{
                    title: 'Onaylar',
                    tabBarIcon: ({ color }) => <TabBarIcon name="checkmark-circle" color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profil',
                    tabBarIcon: ({ color }) => <TabBarIcon name="person" color={color} />,
                }}
            />
        </Tabs>
    );
}
