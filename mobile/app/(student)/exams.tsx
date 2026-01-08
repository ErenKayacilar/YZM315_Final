import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

interface Exam {
    id: number;
    title: string;
    courseTitle: string;
    questionsCount: number;
    duration?: number;
    requiresSeb: boolean;
    hasCompleted?: boolean;
    score?: number;
}

export default function StudentExamsScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];
    const isDark = colorScheme === 'dark';

    const [groupedExams, setGroupedExams] = useState<{ courseTitle: string; exams: Exam[] }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchExams = async () => {
        try {
            // Öğrencinin kayıtlı olduğu derslerin sınavlarını al
            const enrollmentsRes = await api.get('/courses/my-enrollments');
            const grouped: { courseTitle: string; exams: Exam[] }[] = [];

            for (const enrollment of enrollmentsRes.data) {
                try {
                    const courseRes = await api.get(`/courses/${enrollment.id}`);
                    const course = courseRes.data;

                    if (course.exams && course.exams.length > 0) {
                        const courseExams: Exam[] = [];
                        course.exams.forEach((exam: any) => {
                            const hasCompleted = exam.results && exam.results.length > 0;
                            courseExams.push({
                                id: exam.id,
                                title: exam.title,
                                courseTitle: course.title,
                                questionsCount: exam.questions?.length || 0,
                                duration: exam.duration,
                                requiresSeb: exam.requiresSeb,
                                hasCompleted,
                                score: hasCompleted ? exam.results[0].score : undefined,
                            });
                        });

                        if (courseExams.length > 0) {
                            grouped.push({
                                courseTitle: course.title,
                                exams: courseExams
                            });
                        }
                    }
                } catch (err) {
                    // Erişim hatası olabilir
                    console.log(`Failed to fetch course details for ${enrollment.id}`);
                }
            }

            setGroupedExams(grouped);
        } catch (error) {
            console.error('Failed to fetch exams:', error);
            setGroupedExams([]);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchExams();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchExams();
    };

    const handleExamPress = (exam: Exam) => {
        if (exam.requiresSeb) {
            // SEB gerektiren sınavlar mobilde çözülemez - uyarı göster
            return;
        }
        if (!exam.hasCompleted) {
            router.push({ pathname: '/(student)/exam/[id]', params: { id: exam.id.toString() } } as any);
        }
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
            <Text style={[styles.pageTitle, { color: colors.text }]}>
                {t('sidebar.exams')}
            </Text>

            {groupedExams.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name="document-text-outline" size={48} color={isDark ? '#64748b' : '#94a3b8'} />
                    <Text style={[styles.emptyText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        {t('exam.noExams')}
                    </Text>
                </View>
            ) : (
                groupedExams.map((group, groupIndex) => (
                    <View key={`group-${groupIndex}`} style={styles.courseSection}>
                        <View style={styles.courseHeader}>
                            <Ionicons name="school-outline" size={20} color={colors.tint} />
                            <Text style={[styles.courseHeaderTitle, { color: colors.text }]}>
                                {group.courseTitle}
                            </Text>
                        </View>

                        {group.exams.map((exam) => (
                            <TouchableOpacity
                                key={exam.id}
                                style={[
                                    styles.examCard,
                                    { backgroundColor: colors.card, borderColor: colors.border },
                                    exam.requiresSeb && styles.lockedCard,
                                ]}
                                activeOpacity={exam.requiresSeb || exam.hasCompleted ? 1 : 0.7}
                                onPress={() => handleExamPress(exam)}
                            >
                                <View style={styles.examHeader}>
                                    <View style={[
                                        styles.iconContainer,
                                        {
                                            backgroundColor: exam.hasCompleted
                                                ? '#10b98120'
                                                : exam.requiresSeb
                                                    ? '#f59e0b20'
                                                    : `${colors.tint}20`
                                        }
                                    ]}>
                                        <Ionicons
                                            name={
                                                exam.hasCompleted
                                                    ? 'checkmark-circle'
                                                    : exam.requiresSeb
                                                        ? 'lock-closed'
                                                        : 'document-text'
                                            }
                                            size={24}
                                            color={
                                                exam.hasCompleted
                                                    ? '#10b981'
                                                    : exam.requiresSeb
                                                        ? '#f59e0b'
                                                        : colors.tint
                                            }
                                        />
                                    </View>
                                    <View style={styles.examInfo}>
                                        <Text style={[styles.examTitle, { color: colors.text }]}>{exam.title}</Text>
                                        {!exam.requiresSeb && !exam.hasCompleted && (
                                            <Text style={[styles.examDetailText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                                                {exam.questionsCount} soru {exam.duration ? `• ${exam.duration} dk` : ''}
                                            </Text>
                                        )}
                                    </View>
                                    {!exam.requiresSeb && !exam.hasCompleted && (
                                        <Ionicons name="chevron-forward" size={20} color={isDark ? '#64748b' : '#94a3b8'} />
                                    )}
                                </View>

                                {/* SEB Warning */}
                                {exam.requiresSeb && !exam.hasCompleted && (
                                    <View style={[styles.sebWarning, { backgroundColor: '#f59e0b15' }]}>
                                        <Ionicons name="warning" size={16} color="#f59e0b" />
                                        <Text style={styles.sebWarningText}>
                                            Bu sınava sadece bilgisayardan (SEB ile) girebilirsiniz.
                                        </Text>
                                    </View>
                                )}

                                {/* Completed Badge */}
                                {exam.hasCompleted && (
                                    <View style={[styles.completedBadge, { backgroundColor: '#10b98115' }]}>
                                        <Ionicons name="checkmark-done" size={16} color="#10b981" />
                                        <Text style={styles.completedText}>
                                            Tamamlandı - Puan: {exam.score}/100
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    pageTitle: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
    examCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
    lockedCard: { opacity: 0.8 },
    courseSection: { marginBottom: 24 },
    courseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4, gap: 8 },
    courseHeaderTitle: { fontSize: 18, fontWeight: '700' },
    examHeader: { flexDirection: 'row', alignItems: 'center' },
    iconContainer: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    examInfo: { flex: 1 },
    examTitle: { fontSize: 16, fontWeight: '600' },
    examDetailText: { fontSize: 13, marginTop: 4 },
    examStats: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 16 },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: { fontSize: 13 },
    sebWarning: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, marginTop: 12, gap: 8 },
    sebWarningText: { color: '#f59e0b', fontSize: 12, flex: 1 },
    completedBadge: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, marginTop: 12, gap: 8 },
    completedText: { color: '#10b981', fontSize: 13, fontWeight: '500' },
    emptyCard: { padding: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    emptyText: { fontSize: 16, marginTop: 16 },
});
