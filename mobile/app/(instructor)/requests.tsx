import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { api } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

interface EnrollmentRequest {
    id: number;
    userId: number;
    courseId: number;
    status: string;
    courseName: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
}

export default function RequestsScreen() {
    const { t } = useTranslation();
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];
    const isDark = colorScheme === 'dark';

    const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRequests = async () => {
        try {
            // Önce eğitmenin derslerini al, sonra her dersin kayıt isteklerini al
            const coursesRes = await api.get('/courses/my-courses');
            const allRequests: EnrollmentRequest[] = [];

            for (const course of coursesRes.data) {
                try {
                    const enrollmentsRes = await api.get(`/courses/${course.id}/enrollments`);
                    const pendingRequests = enrollmentsRes.data
                        .filter((e: any) => e.status === 'PENDING')
                        .map((e: any) => ({
                            ...e,
                            courseName: course.title,
                        }));
                    allRequests.push(...pendingRequests);
                } catch (err) {
                    // İzin hatası olabilir, devam et
                }
            }

            setRequests(allRequests);
        } catch (error) {
            console.error('Failed to fetch requests:', error);
            setRequests([]);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchRequests();
    };

    const handleApprove = async (courseId: number, studentId: number) => {
        try {
            await api.patch(`/courses/${courseId}/enrollments/${studentId}`, { status: 'APPROVED' });
            Alert.alert('Başarılı', 'Kayıt onaylandı.');
            fetchRequests();
        } catch (error) {
            Alert.alert('Hata', t('enrollment.updateFailed'));
        }
    };

    const handleReject = async (courseId: number, studentId: number) => {
        Alert.alert(
            'Reddet',
            'Bu kayıt isteğini reddetmek istediğinize emin misiniz?',
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.confirm'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.patch(`/courses/${courseId}/enrollments/${studentId}`, { status: 'REJECTED' });
                            Alert.alert('Başarılı', 'Kayıt reddedildi.');
                            fetchRequests();
                        } catch (error) {
                            Alert.alert('Hata', t('enrollment.updateFailed'));
                        }
                    },
                },
            ]
        );
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
                {t('course.requests')}
            </Text>

            {requests.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name="people-outline" size={48} color={isDark ? '#64748b' : '#94a3b8'} />
                    <Text style={[styles.emptyText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        {t('enrollment.noRequests')}
                    </Text>
                </View>
            ) : (
                requests.map((request) => (
                    <View
                        key={`${request.courseId}-${request.userId}`}
                        style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                        <View style={styles.requestHeader}>
                            <View style={[styles.avatar, { backgroundColor: `${colors.tint}20` }]}>
                                <Text style={[styles.avatarText, { color: colors.tint }]}>
                                    {request.user.name?.[0]?.toUpperCase() || '?'}
                                </Text>
                            </View>
                            <View style={styles.userInfo}>
                                <Text style={[styles.userName, { color: colors.text }]}>
                                    {request.user.name}
                                </Text>
                                <Text style={[styles.userEmail, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                                    {request.user.email}
                                </Text>
                                <Text style={[styles.courseName, { color: colors.tint }]}>
                                    {request.courseName}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.rejectButton]}
                                onPress={() => handleReject(request.courseId, request.userId)}
                            >
                                <Ionicons name="close" size={20} color="#ef4444" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.approveButton]}
                                onPress={() => handleApprove(request.courseId, request.userId)}
                            >
                                <Ionicons name="checkmark" size={20} color="#10b981" />
                            </TouchableOpacity>
                        </View>
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
    requestCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
    requestHeader: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { fontSize: 18, fontWeight: '600' },
    userInfo: { flex: 1 },
    userName: { fontSize: 16, fontWeight: '600' },
    userEmail: { fontSize: 13, marginTop: 2 },
    courseName: { fontSize: 12, marginTop: 4, fontWeight: '500' },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 12 },
    actionButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    rejectButton: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
    approveButton: { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
    emptyCard: { padding: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    emptyText: { fontSize: 16, marginTop: 16 },
});
