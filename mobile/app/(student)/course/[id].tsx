import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Video, ResizeMode } from 'expo-av';
import * as Linking from 'expo-linking';

import { useAuth, api } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Config } from '@/constants/Config';

interface Lesson {
    id: number;
    title: string;
    type: 'VIDEO' | 'PDF' | 'LIVE_LINK' | 'TEXT';
    url: string;
}

interface Module {
    id: number;
    title: string;
    lessons: Lesson[];
}

interface CourseDetail {
    id: number;
    title: string;
    description?: string;
    hasLab?: boolean;
    instructor?: { name: string };
    modules: Module[];
    theoryScore?: number;
    labScore?: number;
}

export default function StudentCourseDetailScreen() {
    const { t } = useTranslation();
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];
    const isDark = colorScheme === 'dark';

    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());

    const fetchCourse = async () => {
        try {
            const response = await api.get(`/courses/${id}`);
            let courseData = response.data;

            // Fetch enrollment scores - match by courseId, not enrollment id
            try {
                const enrollRes = await api.get('/courses/my-enrollments');
                const myEnrollment = enrollRes.data.find((e: any) => e.id === Number(id));
                if (myEnrollment) {
                    courseData = {
                        ...courseData,
                        theoryScore: myEnrollment.theoryScore,
                        labScore: myEnrollment.labScore,
                        hasLab: myEnrollment.hasLab
                    };
                }
            } catch (e) {
                // Enrollment fetch might fail
            }

            setCourse(courseData);

            // Get completed lessons
            if (response.data.modules) {
                const lessonIds = response.data.modules.flatMap((m: any) => m.lessons.map((l: any) => l.id));
                const completed = new Set<number>();
                for (const lessonId of lessonIds) {
                    try {
                        const lessonProgress = await api.get(`/progress/lesson/${lessonId}`);
                        if (lessonProgress.data.isCompleted) {
                            completed.add(lessonId);
                        }
                    } catch (e) { }
                }
                setCompletedLessons(completed);
            }
        } catch (err: any) {
            console.error('Failed to fetch course:', err);
            setError(err.response?.data?.message || 'Ders yüklenemedi');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (id) fetchCourse();
    }, [id]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchCourse();
    };

    const handleLessonPress = async (lesson: Lesson) => {
        let url = lesson.url;

        // Fix localhost URL issue for physical devices/emulators
        if (url.includes('localhost')) {
            const apiBase = Config.API_URL;
            const origin = apiBase.replace('/api', '').replace(/\/$/, '');
            url = url.replace(/http:\/\/localhost:\d+/, origin);
        }

        try {
            await Linking.openURL(url);
        } catch (err) {
            console.error('Link açılamadı:', err);
        }

        if (!completedLessons.has(lesson.id)) {
            try {
                await api.post('/progress/complete', { lessonId: lesson.id });
                setCompletedLessons(prev => new Set([...prev, lesson.id]));
            } catch (e) {
                console.error('Failed to mark lesson complete:', e);
            }
        }
    };

    const getLessonIcon = (type: string) => {
        switch (type) {
            case 'VIDEO': return 'play-circle';
            case 'PDF': return 'document-text';
            case 'LIVE_LINK': return 'link';
            default: return 'document';
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    if (error || !course) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                <Ionicons name="alert-circle" size={48} color="#ef4444" />
                <Text style={styles.errorTitle}>{error || t('course.courseNotFound')}</Text>
                <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.tint }]} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>{t('common.back')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>


            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />}
            >
                <View style={styles.header}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.notesButton, { backgroundColor: `${colors.tint}20` }]}
                            onPress={() => router.push({ pathname: '/(student)/course/[id]/notes', params: { id } } as any)}
                        >
                            <Ionicons name="document-text-outline" size={20} color={colors.tint} />
                            <Text style={[styles.notesButtonText, { color: colors.tint }]}>{t('course.notes')}</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.courseTitle, { color: colors.text }]}>{course.title}</Text>
                    {course.instructor?.name && (
                        <Text style={[styles.instructorName, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                            {t('dashboard.instructor')}: {course.instructor.name}
                        </Text>
                    )}
                </View>

                {course.description && (
                    <Text style={[styles.description, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        {course.description}
                    </Text>
                )}

                {/* Scores Card */}
                {(course.theoryScore !== undefined || course.labScore !== undefined) && (
                    <View style={[styles.scoresCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.scoresTitle, { color: colors.text }]}>📊 Notlarınız</Text>
                        <View style={styles.scoresRow}>
                            {course.theoryScore !== undefined && (
                                <View style={styles.scoreItem}>
                                    <Text style={[styles.scoreLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Dönem Puanı</Text>
                                    <Text style={[styles.scoreValue, { color: colors.tint }]}>{course.theoryScore}</Text>
                                </View>
                            )}
                            {course.hasLab && course.labScore !== undefined && (
                                <View style={styles.scoreItem}>
                                    <Text style={[styles.scoreLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Lab Puanı</Text>
                                    <Text style={[styles.scoreValue, { color: '#a855f7' }]}>{course.labScore}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('course.curriculum')}</Text>

                    {course.modules.length === 0 ? (
                        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.emptyText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                                {t('course.noContent')}
                            </Text>
                        </View>
                    ) : (
                        course.modules.map((module) => (
                            <View key={module.id} style={[styles.moduleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Text style={[styles.moduleTitle, { color: colors.text }]}>{module.title}</Text>
                                {module.lessons.map((lesson) => {
                                    const isCompleted = completedLessons.has(lesson.id);
                                    return (
                                        <TouchableOpacity
                                            key={lesson.id}
                                            style={[styles.lessonItem, { borderColor: colors.border }]}
                                            onPress={() => handleLessonPress(lesson)}
                                        >
                                            <Ionicons name={getLessonIcon(lesson.type)} size={20} color={isCompleted ? '#10b981' : colors.tint} />
                                            <Text style={[styles.lessonTitle, { color: colors.text }]}>{lesson.title}</Text>
                                            {isCompleted ? (
                                                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                                            ) : (
                                                <Ionicons name="chevron-forward" size={16} color={isDark ? '#64748b' : '#94a3b8'} />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorTitle: { color: '#ef4444', fontSize: 16, marginTop: 12, textAlign: 'center' },
    backButton: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    backButtonText: { color: '#fff', fontWeight: '600' },
    content: { padding: 20 },
    header: { marginBottom: 16 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    notesButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
    notesButtonText: { fontSize: 14, fontWeight: '500' },
    courseTitle: { fontSize: 24, fontWeight: '700' },
    instructorName: { fontSize: 14, marginTop: 8 },
    description: { fontSize: 15, lineHeight: 22, marginBottom: 24 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
    moduleCard: { borderRadius: 12, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
    moduleTitle: { fontSize: 16, fontWeight: '600', padding: 16 },
    lessonItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderTopWidth: 1 },
    lessonTitle: { flex: 1, fontSize: 14, marginLeft: 12 },
    emptyCard: { padding: 24, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    emptyText: { fontSize: 14 },
    videoContainer: { backgroundColor: '#000', width: '100%', aspectRatio: 16 / 9 },
    video: { flex: 1 },
    closeVideo: { position: 'absolute', top: 10, right: 10, zIndex: 10 },
    videoTitle: { color: '#fff', fontSize: 14, padding: 12, backgroundColor: 'rgba(0,0,0,0.5)' },
    scoresCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 24 },
    scoresTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
    scoresRow: { flexDirection: 'row', gap: 24 },
    scoreItem: { alignItems: 'center' },
    scoreLabel: { fontSize: 13, marginBottom: 4 },
    scoreValue: { fontSize: 24, fontWeight: '700' },
});
