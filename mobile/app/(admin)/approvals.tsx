import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

interface PendingUser {
    id: number;
    name: string;
    email: string;
    createdAt: string;
}

export default function AdminApprovals() {
    const { api } = useAuth();
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];
    const [users, setUsers] = useState<PendingUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPendingUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/approvals/pending');
            setUsers(res.data);
        } catch (error) {
            console.error('Error fetching approvals:', error);
            Alert.alert('Hata', 'Bekleyen eğitmenler listesi alınamadı.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchPendingUsers();
    };

    const handleApprove = async (id: number) => {
        try {
            await api.post(`/admin/approvals/${id}/approve`);
            Alert.alert('Başarılı', 'Eğitmen onaylandı.');
            setUsers(prev => prev.filter(u => u.id !== id));
        } catch (error) {
            console.error('Approve error:', error);
            Alert.alert('Hata', 'Onaylama işlemi başarısız.');
        }
    };

    const handleReject = (id: number) => {
        Alert.alert(
            'Reddet',
            'Bu eğitmeni reddetmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Reddet',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/admin/approvals/${id}/reject`);
                            setUsers(prev => prev.filter(u => u.id !== id));
                        } catch (error) {
                            console.error('Reject error:', error);
                            Alert.alert('Hata', 'Reddetme işlemi başarısız.');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: PendingUser }) => (
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.userInfo}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {(item.name && item.name.length > 0) ? item.name[0].toUpperCase() : '?'}
                    </Text>
                </View>
                <View style={styles.userDetails}>
                    <Text style={[styles.userName, { color: colors.text }]}>{item.name || 'İsimsiz'}</Text>
                    <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{item.email}</Text>
                    <Text style={[styles.date, { color: colors.textSecondary }]}>
                        {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                </View>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.button, styles.rejectButton]}
                    onPress={() => handleReject(item.id)}
                >
                    <Text style={styles.rejectButtonText}>Reddet</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.approveButton]}
                    onPress={() => handleApprove(item.id)}
                >
                    <Text style={styles.approveButtonText}>Onayla</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Eğitmen Onayları</Text>
            </View>

            {loading && !refreshing ? (
                <ActivityIndicator size="large" color={colors.tint} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={users}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            Bekleyen eğitmen onayı bulunmamaktadır.
                        </Text>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 20,
    },
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    userInfo: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#3b82f6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    avatarText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    userDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    userEmail: {
        fontSize: 14,
        marginTop: 2,
    },
    date: {
        fontSize: 12,
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    approveButton: {
        backgroundColor: '#10b981',
    },
    rejectButton: {
        backgroundColor: '#ef4444',
    },
    approveButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    rejectButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
    },
});
