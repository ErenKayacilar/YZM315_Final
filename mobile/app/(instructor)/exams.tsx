import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Modal,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAuth, api } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

interface ExamResult {
    id: number;
    score: number;
    completedAt: string;
    user: { id: number; name: string; email: string };
}

interface Exam {
    id: number;
    title: string;
    courseTitle: string;
    questionsCount: number;
    duration?: number;
    requiresSeb: boolean;
}

export default function InstructorExamsScreen() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];
    const isDark = colorScheme === 'dark';

    const [groupedExams, setGroupedExams] = useState<{ courseTitle: string; exams: Exam[] }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
    const [results, setResults] = useState<ExamResult[]>([]);
    const [loadingResults, setLoadingResults] = useState(false);
    const [showResultsModal, setShowResultsModal] = useState(false);

    const fetchExams = async () => {
        try {
            const coursesRes = await api.get('/courses/my-courses');
            const grouped: { courseTitle: string; exams: Exam[] }[] = [];

            for (const course of coursesRes.data) {
                if (course.exams && course.exams.length > 0) {
                    const courseExams: Exam[] = [];
                    course.exams.forEach((exam: any) => {
                        courseExams.push({
                            id: exam.id,
                            title: exam.title,
                            courseTitle: course.title,
                            questionsCount: exam.questions?.length || 0,
                            duration: exam.duration,
                            requiresSeb: exam.requiresSeb,
                        });
                    });

                    if (courseExams.length > 0) {
                        grouped.push({
                            courseTitle: course.title,
                            exams: courseExams
                        });
                    }
                }
            }

            setGroupedExams(grouped);
        } catch (error) {
            console.error('Failed to fetch exams:', error);
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

    const handleViewResults = async (exam: Exam) => {
        setSelectedExam(exam);
        setLoadingResults(true);
        setShowResultsModal(true);

        try {
            const res = await api.get(`/exams/${exam.id}/results`);
            setResults(res.data);
        } catch (error) {
            console.error('Failed to fetch results:', error);
            setResults([]);
        } finally {
            setLoadingResults(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return '#10b981';
        if (score >= 60) return '#f59e0b';
        return '#ef4444';
    };

    const getAverageScore = () => {
        if (results.length === 0) return 0;
        const sum = results.reduce((acc, r) => acc + r.score, 0);
        return Math.round(sum / results.length);
    };

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
                }
            >
                <Text style={[styles.title, { color: colors.text }]}>
                    {t('sidebar.exams')}
                </Text>

                {groupedExams.length === 0 ? (
                    <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Ionicons name="document-text-outline" size={48} color={isDark ? '#64748b' : '#94a3b8'} />
                        <Text style={[styles.emptyText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                            Henüz sınav oluşturulmadı.
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
                                <View
                                    key={exam.id}
                                    style={[styles.examCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                                >
                                    <View style={styles.examHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.examTitle, { color: colors.text }]}>{exam.title}</Text>
                                        </View>
                                        {exam.requiresSeb && (
                                            <View style={[styles.sebBadge, { backgroundColor: '#f59e0b20' }]}>
                                                <Ionicons name="lock-closed" size={14} color="#f59e0b" />
                                                <Text style={styles.sebText}>SEB</Text>
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.examStats}>
                                        <View style={styles.statItem}>
                                            <Ionicons name="help-circle-outline" size={16} color={colors.tint} />
                                            <Text style={[styles.statText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                                                {exam.questionsCount} soru
                                            </Text>
                                        </View>
                                        {exam.duration && (
                                            <View style={styles.statItem}>
                                                <Ionicons name="time-outline" size={16} color={colors.tint} />
                                                <Text style={[styles.statText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                                                    {exam.duration} dk
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.buttonRow}>
                                        <TouchableOpacity
                                            style={[styles.scanButton, { backgroundColor: '#8b5cf620' }]}
                                            onPress={() => router.push({
                                                pathname: '/optical-scan',
                                                params: { examId: exam.id.toString(), examTitle: exam.title }
                                            } as any)}
                                        >
                                            <Ionicons name="scan-outline" size={18} color="#8b5cf6" />
                                            <Text style={[styles.scanButtonText, { color: '#8b5cf6' }]}>
                                                Optik Oku
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.resultsButton, { backgroundColor: `${colors.tint}15` }]}
                                            onPress={() => handleViewResults(exam)}
                                        >
                                            <Ionicons name="stats-chart" size={18} color={colors.tint} />
                                            <Text style={[styles.resultsButtonText, { color: colors.tint }]}>
                                                Sonuçlar
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Results Modal */}
            <Modal
                visible={showResultsModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowResultsModal(false)}
            >
                <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <TouchableOpacity onPress={() => setShowResultsModal(false)}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {selectedExam?.title}
                        </Text>
                        <View style={{ width: 24 }} />
                    </View>

                    {loadingResults ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.tint} />
                        </View>
                    ) : results.length === 0 ? (
                        <View style={styles.emptyResults}>
                            <Ionicons name="document-text-outline" size={64} color={isDark ? '#64748b' : '#94a3b8'} />
                            <Text style={[styles.emptyResultsText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                                Henüz sonuç yok.
                            </Text>
                        </View>
                    ) : (
                        <>
                            {/* Stats Summary */}
                            <View style={[styles.statsSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <View style={styles.summaryItem}>
                                    <Text style={[styles.summaryValue, { color: colors.tint }]}>{results.length}</Text>
                                    <Text style={[styles.summaryLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Katılımcı</Text>
                                </View>
                                <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                                <View style={styles.summaryItem}>
                                    <Text style={[styles.summaryValue, { color: getScoreColor(getAverageScore()) }]}>
                                        {getAverageScore()}%
                                    </Text>
                                    <Text style={[styles.summaryLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Ortalama</Text>
                                </View>
                            </View>

                            {/* Results List */}
                            <FlatList
                                data={results}
                                keyExtractor={(item) => item.id.toString()}
                                contentContainerStyle={styles.resultsList}
                                renderItem={({ item }) => (
                                    <View style={[styles.resultItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                        <View style={styles.resultInfo}>
                                            <Text style={[styles.studentName, { color: colors.text }]}>
                                                {item.user.name || item.user.email}
                                            </Text>
                                            <Text style={[styles.resultDate, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                                                {formatDate(item.completedAt)}
                                            </Text>
                                        </View>
                                        <View style={[styles.scoreBadge, { backgroundColor: `${getScoreColor(item.score)}20` }]}>
                                            <Text style={[styles.scoreText, { color: getScoreColor(item.score) }]}>
                                                {item.score}%
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            />
                        </>
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
    emptyCard: { padding: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    emptyText: { fontSize: 15, marginTop: 12 },
    examCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
    courseSection: { marginBottom: 24 },
    courseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4, gap: 8 },
    courseHeaderTitle: { fontSize: 18, fontWeight: '700' },
    examHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    examTitle: { fontSize: 16, fontWeight: '600' },
    sebBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
    sebText: { color: '#f59e0b', fontSize: 11, fontWeight: '600' },
    examStats: { flexDirection: 'row', marginTop: 12, gap: 16 },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: { fontSize: 13 },
    resultsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, marginTop: 12, gap: 6 },
    resultsButtonText: { fontSize: 14, fontWeight: '600' },
    modalContainer: { flex: 1 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
    modalTitle: { fontSize: 18, fontWeight: '600' },
    emptyResults: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyResultsText: { fontSize: 16, marginTop: 12 },
    statsSummary: { flexDirection: 'row', margin: 16, padding: 20, borderRadius: 12, borderWidth: 1 },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryValue: { fontSize: 28, fontWeight: '700' },
    summaryLabel: { fontSize: 13, marginTop: 4 },
    summaryDivider: { width: 1, marginVertical: 4 },
    resultsList: { padding: 16, paddingTop: 0 },
    resultItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
    resultInfo: { flex: 1 },
    studentName: { fontSize: 15, fontWeight: '500' },
    resultDate: { fontSize: 12, marginTop: 2 },
    scoreBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    scoreText: { fontSize: 16, fontWeight: '700' },
    buttonRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    scanButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, gap: 6 },
    scanButtonText: { fontSize: 14, fontWeight: '600' },
});
