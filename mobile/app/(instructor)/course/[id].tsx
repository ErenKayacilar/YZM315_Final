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
    TextInput,
    Alert,
    Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

interface Module {
    id: number;
    title: string;
    lessons: { id: number; title: string; type: string }[];
}

interface Exam {
    id: number;
    title: string;
    questionsCount: number;
    requiresSeb: boolean;
}

interface Course {
    id: number;
    title: string;
    description?: string;
    hasLab?: boolean;
    modules: Module[];
    exams: Exam[];
}

interface Enrollment {
    id: number;
    user: { id: number; name?: string; email: string };
    status: string;
    theoryScore?: number;
    labScore?: number;
}

export default function InstructorCourseDetailScreen() {
    const { t } = useTranslation();
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];
    const isDark = colorScheme === 'dark';

    const [course, setCourse] = useState<Course | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal states
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [moduleTitle, setModuleTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Grading state
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [showGradeModal, setShowGradeModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Enrollment | null>(null);
    const [theoryScore, setTheoryScore] = useState('');
    const [labScore, setLabScore] = useState('');

    const fetchCourse = async () => {
        try {
            const res = await api.get(`/courses/${id}`);
            setCourse(res.data);
        } catch (error) {
            console.error('Failed to fetch course:', error);
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
        fetchEnrollments();
    };

    const fetchEnrollments = async () => {
        try {
            const res = await api.get(`/courses/${id}/enrollments`);
            setEnrollments(res.data.filter((e: any) => e.status === 'APPROVED'));
        } catch (error) {
            console.error('Failed to fetch enrollments:', error);
        }
    };

    useEffect(() => {
        if (id) fetchEnrollments();
    }, [id]);

    const handleSaveGrade = async () => {
        if (!selectedStudent) return;
        setIsSaving(true);
        try {
            await api.put(`/courses/${id}/grade`, {
                studentId: selectedStudent.user.id,
                theoryScore: theoryScore ? parseFloat(theoryScore) : undefined,
                labScore: labScore ? parseFloat(labScore) : undefined
            });
            setShowGradeModal(false);
            setSelectedStudent(null);
            setTheoryScore('');
            setLabScore('');
            fetchEnrollments();
            Alert.alert('Başarılı', 'Not kaydedildi.');
        } catch (error: any) {
            Alert.alert('Hata', error.response?.data?.message || 'Not kaydedilemedi.');
        } finally {
            setIsSaving(false);
        }
    };

    const openGradeModal = (enrollment: Enrollment) => {
        setSelectedStudent(enrollment);
        setTheoryScore(enrollment.theoryScore?.toString() || '');
        setLabScore(enrollment.labScore?.toString() || '');
        setShowGradeModal(true);
    };

    const handleAddModule = async () => {
        if (!moduleTitle.trim()) {
            Alert.alert('Hata', 'Modül başlığı boş olamaz.');
            return;
        }

        setIsSaving(true);
        try {
            await api.post(`/courses/${id}/modules`, { title: moduleTitle.trim() });
            setModuleTitle('');
            setShowModuleModal(false);
            fetchCourse();
            Alert.alert('Başarılı', 'Modül eklendi.');
        } catch (error: any) {
            Alert.alert('Hata', error.response?.data?.message || 'Modül eklenemedi.');
        } finally {
            setIsSaving(false);
        }
    };



    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    if (!course) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                <Ionicons name="alert-circle" size={48} color="#ef4444" />
                <Text style={styles.errorText}>Ders bulunamadı.</Text>
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
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.courseTitle, { color: colors.text }]}>{course.title}</Text>
                    <TouchableOpacity
                        style={[styles.notesButton, { backgroundColor: `${colors.tint}20` }]}
                        onPress={() => router.push({ pathname: '/course/[id]/notes', params: { id } } as any)}
                    >
                        <Ionicons name="document-text-outline" size={18} color={colors.tint} />
                    </TouchableOpacity>
                </View>

                {/* Modules Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Modüller</Text>
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: colors.tint }]}
                            onPress={() => setShowModuleModal(true)}
                        >
                            <Ionicons name="add" size={18} color="#fff" />
                            <Text style={styles.addButtonText}>Modül Ekle</Text>
                        </TouchableOpacity>
                    </View>

                    {course.modules.length === 0 ? (
                        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.emptyText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                                Henüz modül eklenmemiş.
                            </Text>
                        </View>
                    ) : (
                        course.modules.map((module) => (
                            <View key={module.id} style={[styles.moduleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <View style={styles.moduleHeaderRow}>
                                    <Text style={[styles.moduleTitle, { color: colors.text, flex: 1 }]}>{module.title}</Text>
                                    <TouchableOpacity
                                        style={[styles.addLessonButton, { backgroundColor: colors.tint + '15' }]}
                                        onPress={() => router.push({ pathname: '/(instructor)/course/[id]/create-lesson', params: { id, moduleId: module.id } } as any)}
                                    >
                                        <Ionicons name="add" size={20} color={colors.tint} />
                                    </TouchableOpacity>
                                </View>
                                <Text style={[styles.lessonCount, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                                    {module.lessons.length} içerik
                                </Text>
                            </View>
                        ))
                    )}
                </View>

                {/* Exams Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Sınavlar</Text>
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: colors.tint }]}
                            onPress={() => router.push({ pathname: '/(instructor)/course/[id]/create-exam', params: { id } } as any)}
                        >
                            <Ionicons name="add" size={18} color="#fff" />
                            <Text style={styles.addButtonText}>Sınav Ekle</Text>
                        </TouchableOpacity>
                    </View>

                    {course.exams?.length === 0 ? (
                        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.emptyText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                                Henüz sınav eklenmemiş.
                            </Text>
                        </View>
                    ) : (
                        course.exams?.map((exam) => (
                            <View key={exam.id} style={[styles.examCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.examTitle, { color: colors.text }]}>{exam.title}</Text>
                                    <Text style={[styles.examInfo, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                                        {exam.questionsCount || 0} soru
                                    </Text>
                                </View>
                                {exam.requiresSeb && (
                                    <View style={[styles.sebBadge, { backgroundColor: '#f59e0b20' }]}>
                                        <Ionicons name="lock-closed" size={12} color="#f59e0b" />
                                        <Text style={styles.sebText}>SEB</Text>
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </View>

                {/* Gradebook Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 Not Defteri</Text>
                        {course.hasLab && (
                            <View style={[styles.labBadge, { backgroundColor: '#a855f720' }]}>
                                <Text style={styles.labBadgeText}>🧪 Lab</Text>
                            </View>
                        )}
                    </View>

                    {enrollments.length === 0 ? (
                        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.emptyText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                                Henüz onaylanmış öğrenci yok.
                            </Text>
                        </View>
                    ) : (
                        enrollments.map((enr) => (
                            <TouchableOpacity
                                key={enr.id}
                                style={[styles.studentCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                                onPress={() => openGradeModal(enr)}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.studentName, { color: colors.text }]}>{enr.user.name || enr.user.email}</Text>
                                    <View style={styles.scoresRow}>
                                        <Text style={[styles.scoreText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                                            Genel: {enr.theoryScore !== undefined ? enr.theoryScore : '-'}
                                        </Text>
                                        {course.hasLab && (
                                            <Text style={[styles.scoreText, { color: '#a855f7' }]}>
                                                Lab: {enr.labScore !== undefined ? enr.labScore : '-'}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                                <Ionicons name="create-outline" size={20} color={colors.tint} />
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Add Module Modal */}
            <Modal visible={showModuleModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Yeni Modül</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: colors.text, borderColor: colors.border }]}
                            placeholder="Modül başlığı"
                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                            value={moduleTitle}
                            onChangeText={setModuleTitle}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}
                                onPress={() => setShowModuleModal(false)}
                            >
                                <Text style={[styles.modalButtonText, { color: colors.text }]}>{t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.tint }]}
                                onPress={handleAddModule}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.modalButtonTextWhite}>Ekle</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>



            {/* Grade Modal */}
            <Modal visible={showGradeModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>📝 Not Girişi</Text>
                        <Text style={[styles.studentLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                            {selectedStudent?.user.name || selectedStudent?.user.email}
                        </Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: colors.text, borderColor: colors.border }]}
                            placeholder="Genel Puan (0-100)"
                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                            value={theoryScore}
                            onChangeText={setTheoryScore}
                            keyboardType="numeric"
                        />
                        {course?.hasLab && (
                            <TextInput
                                style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: colors.text, borderColor: colors.border }]}
                                placeholder="Lab Puanı (0-100)"
                                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                value={labScore}
                                onChangeText={setLabScore}
                                keyboardType="numeric"
                            />
                        )}
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}
                                onPress={() => setShowGradeModal(false)}
                            >
                                <Text style={[styles.modalButtonText, { color: colors.text }]}>{t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: '#22c55e' }]}
                                onPress={handleSaveGrade}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.modalButtonTextWhite}>Kaydet</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorText: { color: '#ef4444', fontSize: 16, marginTop: 12 },
    backButton: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    backButtonText: { color: '#fff', fontWeight: '600' },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 },
    courseTitle: { fontSize: 22, fontWeight: '700', flex: 1 },
    notesButton: { padding: 10, borderRadius: 8 },
    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '600' },
    addButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 4 },
    addButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    emptyCard: { padding: 24, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    emptyText: { fontSize: 14 },
    moduleCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
    moduleHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    moduleTitle: { fontSize: 15, fontWeight: '600' },
    addLessonButton: { padding: 8, borderRadius: 8 },
    lessonCount: { fontSize: 13, marginTop: 4 },
    examCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
    examTitle: { fontSize: 15, fontWeight: '600' },
    examInfo: { fontSize: 13, marginTop: 2 },
    sebBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
    sebText: { color: '#f59e0b', fontSize: 11, fontWeight: '600' },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { width: '85%', padding: 24, borderRadius: 16 },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
    input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 12 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, marginBottom: 12 },
    switchLabel: { fontSize: 15 },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
    modalButton: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
    modalButtonText: { fontSize: 15, fontWeight: '600' },
    modalButtonTextWhite: { color: '#fff', fontSize: 15, fontWeight: '600' },
    labBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    labBadgeText: { color: '#a855f7', fontSize: 12, fontWeight: '600' },
    studentCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
    studentName: { fontSize: 15, fontWeight: '600' },
    scoresRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
    scoreText: { fontSize: 13 },
    studentLabel: { fontSize: 14, marginBottom: 12, textAlign: 'center' },
});
