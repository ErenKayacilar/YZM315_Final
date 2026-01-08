import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAuth, api } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

interface Course {
    id: number;
    title: string;
    examsCount?: number;
}

export default function InstructorDashboard() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];
    const isDark = colorScheme === 'dark';

    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCourses = async () => {
        try {
            setError(null);
            const response = await api.get('/courses/my-courses');
            const instructorCourses = response.data.map((course: any) => ({
                id: course.id,
                title: course.title,
                examsCount: course.exams?.length || 0,
            }));
            setCourses(instructorCourses);
        } catch (err: any) {
            console.error('Failed to fetch courses:', err);
            setError(err.response?.data?.message || 'Bağlantı hatası');
            setCourses([]);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchCourses();
        }
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchCourses();
    };

    const handleCoursePress = (courseId: number) => {
        router.push({ pathname: '/(instructor)/course/[id]', params: { id: courseId.toString() } } as any);
    };

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
            }
        >
            {/* Welcome Header */}
            <View style={styles.header}>
                <Text style={[styles.welcomeText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    Hoş geldin 👋
                </Text>
                <Text style={[styles.userName, { color: colors.text }]}>
                    {user?.name || user?.email}
                </Text>
                <Text style={[styles.dashboardTitle, { color: colors.tint }]}>
                    {t('dashboard.instructorTitle')}
                </Text>
            </View>

            {/* Error */}
            {error && (
                <View style={[styles.errorCard, { borderColor: '#ef4444' }]}>
                    <Ionicons name="warning" size={20} color="#ef4444" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name="book" size={28} color={colors.tint} />
                    <Text style={[styles.statValue, { color: colors.text }]}>{courses.length}</Text>
                    <Text style={[styles.statLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Ders</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name="document-text" size={28} color="#10b981" />
                    <Text style={[styles.statValue, { color: colors.text }]}>
                        {courses.reduce((sum, c) => sum + (c.examsCount || 0), 0)}
                    </Text>
                    <Text style={[styles.statLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Sınav</Text>
                </View>
            </View>

            {/* Optik Okuyucu Button */}
            <TouchableOpacity
                style={[styles.scannerButton, { backgroundColor: '#8b5cf6' }]}
                activeOpacity={0.8}
                onPress={() => router.push('/optical-scan' as any)}
            >
                <View style={styles.scannerButtonContent}>
                    <View style={styles.scannerIconContainer}>
                        <Ionicons name="scan-outline" size={32} color="white" />
                    </View>
                    <View style={styles.scannerTextContainer}>
                        <Text style={styles.scannerButtonTitle}>Optik Okuyucu</Text>
                        <Text style={styles.scannerButtonSubtitle}>Optik form tarayarak not girin</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
                </View>
            </TouchableOpacity>

            {/* Courses Section */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {t('dashboard.myCourses')}
                </Text>

                {courses.length === 0 ? (
                    <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Ionicons name="book-outline" size={48} color={isDark ? '#64748b' : '#94a3b8'} />
                        <Text style={[styles.emptyText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                            Henüz ders oluşturmadınız.
                        </Text>
                    </View>
                ) : (
                    courses.map((course) => (
                        <TouchableOpacity
                            key={course.id}
                            style={[styles.courseCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                            activeOpacity={0.7}
                            onPress={() => handleCoursePress(course.id)}
                        >
                            <View style={styles.courseHeader}>
                                <Text style={[styles.courseTitle, { color: colors.text }]}>
                                    {course.title}
                                </Text>
                                <Ionicons name="chevron-forward" size={20} color={isDark ? '#64748b' : '#94a3b8'} />
                            </View>
                            <Text style={[styles.examCount, { color: colors.tint }]}>
                                {course.examsCount} sınav
                            </Text>
                        </TouchableOpacity>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { marginBottom: 24 },
    welcomeText: { fontSize: 16, fontWeight: '500' },
    userName: { fontSize: 24, fontWeight: '700', marginTop: 4 },
    dashboardTitle: { fontSize: 14, fontWeight: '600', marginTop: 8 },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    statCard: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: '700', marginTop: 8 },
    statLabel: { fontSize: 12, marginTop: 4 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
    courseCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
    courseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    courseTitle: { fontSize: 16, fontWeight: '600', flex: 1 },
    examCount: { fontSize: 13, marginTop: 8 },
    emptyCard: { padding: 24, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    emptyText: { fontSize: 14, marginTop: 12 },
    errorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1 },
    errorText: { color: '#ef4444', marginLeft: 8, fontSize: 14, flex: 1 },
    scannerButton: {
        borderRadius: 16,
        marginBottom: 24,
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    scannerButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    scannerIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerTextContainer: {
        flex: 1,
        marginLeft: 16,
    },
    scannerButtonTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    scannerButtonSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        marginTop: 2,
    },
});
