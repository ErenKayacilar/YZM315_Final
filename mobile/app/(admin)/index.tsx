import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
    const { user, api } = useAuth();
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];
    const { t } = useTranslation();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            setLoading(true);
            // Backend'de bu endpoint zaten adminController.ts içinde tanımlı: getStats
            const res = await api.get('/admin/stats');
            setStats(res.data);
        } catch (error) {
            console.error('Stats fetch error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const StatCard = ({ title, value, icon, color }: { title: string, value: number, icon: any, color: string }) => (
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <View>
                <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
                <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>Admin Paneli</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Hoşgeldin, {user?.name}</Text>
                </View>

                {loading && !refreshing ? (
                    <Text style={{ color: colors.text, textAlign: 'center', marginTop: 20 }}>Yükleniyor...</Text>
                ) : stats ? (
                    <View style={styles.grid}>
                        <StatCard title="Toplam Kullanıcı" value={stats.totalUsers} icon="people" color="#3b82f6" />
                        <StatCard title="Toplam Ders" value={stats.totalCourses} icon="library" color="#10b981" />
                        <StatCard title="Toplam Soru" value={stats.totalQuestions} icon="help-circle" color="#f59e0b" />
                        <StatCard title="Öğrenciler" value={stats.totalStudents} icon="school" color="#8b5cf6" />
                        <StatCard title="Eğitmenler" value={stats.totalInstructors} icon="briefcase" color="#ec4899" />
                    </View>
                ) : (
                    <Text style={{ color: colors.text, textAlign: 'center', marginTop: 20 }}>Veri alınamadı.</Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 16,
        marginTop: 4,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    card: {
        width: '47%',
        padding: 16,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    statTitle: {
        fontSize: 14,
        marginTop: 2,
    },
});
