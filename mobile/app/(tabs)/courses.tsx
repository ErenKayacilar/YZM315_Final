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

import { useAuth, api } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Course } from '@/types';

export default function CoursesScreen() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];
    const isDark = colorScheme === 'dark';

    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchCourses = async () => {
        try {
            const response = await api.get('/courses');
            setCourses(response.data);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
            setCourses([]);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchCourses();
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
                {t('sidebar.courses')}
            </Text>

            {courses.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name="book-outline" size={48} color={isDark ? '#64748b' : '#94a3b8'} />
                    <Text style={[styles.emptyText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        {t('course.noContent')}
                    </Text>
                </View>
            ) : (
                courses.map((course) => (
                    <TouchableOpacity
                        key={course.id}
                        style={[styles.courseCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                        activeOpacity={0.7}
                        onPress={() => {
                            // Navigate to course detail (to be implemented)
                            // router.push(`/course/${course.id}`);
                        }}
                    >
                        <View style={styles.courseHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: `${colors.tint}20` }]}>
                                <Ionicons name="book" size={24} color={colors.tint} />
                            </View>
                            <View style={styles.courseInfo}>
                                <Text style={[styles.courseTitle, { color: colors.text }]}>
                                    {course.title}
                                </Text>
                                {course.instructor?.name && (
                                    <Text style={[styles.instructorName, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                                        {t('dashboard.instructor')}: {course.instructor.name}
                                    </Text>
                                )}
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={isDark ? '#64748b' : '#94a3b8'} />
                        </View>
                        {course.description && (
                            <Text
                                style={[styles.description, { color: isDark ? '#94a3b8' : '#64748b' }]}
                                numberOfLines={2}
                            >
                                {course.description}
                            </Text>
                        )}
                    </TouchableOpacity>
                ))
            )}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 20,
    },
    courseCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    courseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    courseInfo: {
        flex: 1,
    },
    courseTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    instructorName: {
        fontSize: 13,
        marginTop: 4,
    },
    description: {
        fontSize: 14,
        marginTop: 12,
        lineHeight: 20,
    },
    emptyCard: {
        padding: 40,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 16,
        marginTop: 16,
    },
});
