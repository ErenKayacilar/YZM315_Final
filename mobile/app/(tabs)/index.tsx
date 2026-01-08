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
import { Role } from '@/types';
import { Config } from '@/constants/Config';

interface CourseProgress {
  id: number;
  title: string;
  progress: number;
  instructor?: { name: string };
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInstructor = user?.role === Role.INSTRUCTOR || user?.role === Role.ADMIN;

  const fetchCourses = async () => {
    try {
      setError(null);
      console.log('Fetching courses from:', Config.API_URL);
      console.log('User role:', user?.role);

      let response;
      if (isInstructor) {
        // Eğitmenler kendi derslerini görür
        response = await api.get('/courses/my-courses');
        const instructorCourses = response.data.map((course: any) => ({
          id: course.id,
          title: course.title,
          progress: 0, // Eğitmenler için ilerleme yok
        }));
        setCourses(instructorCourses);
      } else {
        // Öğrenciler kayıtlı oldukları dersleri görür
        response = await api.get('/courses/my-enrollments');
        const enrolledCourses = response.data.map((course: any) => ({
          id: course.id,
          title: course.title,
          progress: course.progress || 0,
          instructor: course.instructor,
        }));
        setCourses(enrolledCourses);
      }
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

  const getDashboardTitle = () => {
    if (isInstructor) return t('dashboard.instructorTitle');
    return t('dashboard.studentTitle');
  };

  const renderProgressBar = (progress: number) => (
    <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
      <View
        style={[
          styles.progressBarFill,
          { width: `${progress}%`, backgroundColor: colors.tint }
        ]}
      />
    </View>
  );

  const handleCoursePress = (courseId: number) => {
    router.push({ pathname: '/course/[id]', params: { id: courseId.toString() } } as any);
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
          {getDashboardTitle()}
        </Text>
      </View>

      {/* Error Message */}
      {error && (
        <View style={[styles.errorCard, { borderColor: '#ef4444' }]}>
          <Ionicons name="warning" size={20} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Courses Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('dashboard.myCourses')}
        </Text>

        {courses.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="book-outline" size={48} color={isDark ? '#64748b' : '#94a3b8'} />
            <Text style={[styles.emptyText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {isInstructor ? 'Henüz ders oluşturmadınız.' : t('course.noContent')}
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
              {!isInstructor && (
                <>
                  <View style={styles.progressContainer}>
                    <Text style={[styles.progressLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      {t('dashboard.progress')}
                    </Text>
                    <Text style={[styles.progressValue, { color: colors.tint }]}>
                      {course.progress}%
                    </Text>
                  </View>
                  {renderProgressBar(course.progress)}
                </>
              )}
              {isInstructor && (
                <Text style={[styles.instructorBadge, { color: colors.tint }]}>
                  {t('dashboard.manage')} →
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
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
  header: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
  },
  dashboardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  courseCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  errorText: {
    color: '#ef4444',
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  instructorBadge: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
});

