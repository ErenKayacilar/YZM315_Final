
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Switch,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { api } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

interface Question {
    id: number;
    text: string;
    type: string;
    difficulty?: string;
}

export default function CreateExamScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];
    const isDark = colorScheme === 'dark';

    const [isLoading, setIsLoading] = useState(false);
    const [bankQuestions, setBankQuestions] = useState<Question[]>([]);

    // Exam Details
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState('');
    const [requiresSeb, setRequiresSeb] = useState(false);

    // Selection Mode
    const [mode, setMode] = useState<'MANUAL' | 'RANDOM'>('MANUAL');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [randomCount, setRandomCount] = useState('');

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const res = await api.get(`/questions/course/${id}`);
            setBankQuestions(res.data);
        } catch (error) {
            console.error(error);
            Alert.alert('Hata', 'Soru bankası yüklenemedi.');
        }
    };

    const toggleSelection = (qId: number) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(qId)) newSet.delete(qId);
        else newSet.add(qId);
        setSelectedIds(newSet);
    };

    const handleRandomSelect = () => {
        const count = parseInt(randomCount);
        if (isNaN(count) || count <= 0) {
            Alert.alert('Hata', 'Geçerli bir sayı girin.');
            return;
        }
        if (count > bankQuestions.length) {
            Alert.alert('Hata', `Bankada sadece ${bankQuestions.length} soru var.`);
            return;
        }

        // Shuffle and pick
        const shuffled = [...bankQuestions].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, count);
        const newSet = new Set(selected.map(q => q.id));
        setSelectedIds(newSet);
        Alert.alert('Başarılı', `${count} soru rastgele seçildi.`);
    };

    const handleCreate = async () => {
        if (!title.trim()) {
            Alert.alert('Hata', 'Sınav başlığı gereklidir.');
            return;
        }
        if (selectedIds.size === 0) {
            Alert.alert('Hata', 'En az bir soru seçmelisiniz.');
            return;
        }

        setIsLoading(true);
        try {
            // Step 1: Create Exam
            const res = await api.post('/exams', {
                title: title.trim(),
                courseId: Number(id),
                duration: duration ? Number(duration) : null,
                requiresSeb: requiresSeb,
                questions: [] // Empty initially
            });
            const newExamId = res.data.id;

            // Step 2: Add Questions (Bulk)
            const qIds = Array.from(selectedIds);

            if (qIds.length > 0) {
                await api.post(`/exams/${newExamId}/add-questions`, {
                    questionIds: qIds
                });
            }

            Alert.alert('Başarılı', 'Sınav oluşturuldu.');
            router.back();
        } catch (err: any) {
            console.error(err);
            Alert.alert('Hata', 'İşlem başarısız.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Yeni Sınav Oluştur</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Exam Settings */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Sınav Detayları</Text>

                    <TextInput
                        style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: colors.text, borderColor: colors.border }]}
                        placeholder="Sınav Başlığı"
                        placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                        value={title}
                        onChangeText={setTitle}
                    />

                    <TextInput
                        style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: colors.text, borderColor: colors.border }]}
                        placeholder="Süre (dk)"
                        placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                        value={duration}
                        onChangeText={setDuration}
                        keyboardType="numeric"
                    />

                    <View style={styles.switchRow}>
                        <Text style={[styles.label, { color: colors.text }]}>SEB (Güvenli Tarayıcı)</Text>
                        <Switch
                            value={requiresSeb}
                            onValueChange={setRequiresSeb}
                            trackColor={{ false: '#767577', true: colors.tint }}
                        />
                    </View>
                </View>

                {/* Question Selection */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Soru Seçimi</Text>

                    <View style={styles.tabs}>
                        <TouchableOpacity
                            style={[styles.tab, mode === 'MANUAL' && { backgroundColor: colors.tint }]}
                            onPress={() => setMode('MANUAL')}
                        >
                            <Text style={[styles.tabText, mode === 'MANUAL' ? { color: '#fff' } : { color: colors.text }]}>Manuel Seç</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, mode === 'RANDOM' && { backgroundColor: colors.tint }]}
                            onPress={() => setMode('RANDOM')}
                        >
                            <Text style={[styles.tabText, mode === 'RANDOM' ? { color: '#fff' } : { color: colors.text }]}>Rastgele</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.statText, { color: colors.text }]}>
                        Seçili Soru: {selectedIds.size}
                    </Text>

                    {mode === 'RANDOM' ? (
                        <View style={styles.randomContainer}>
                            <Text style={[styles.label, { color: colors.text }]}>Soru Sayısı:</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: colors.text, borderColor: colors.border }]}
                                placeholder={`Max: ${bankQuestions.length}`}
                                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                value={randomCount}
                                onChangeText={setRandomCount}
                                keyboardType="numeric"
                            />
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: colors.tint }]}
                                onPress={handleRandomSelect}
                            >
                                <Text style={styles.buttonText}>Rastgele Seç</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.listContainer}>
                            {bankQuestions.map(q => (
                                <TouchableOpacity
                                    key={q.id}
                                    style={[
                                        styles.questionItem,
                                        { borderColor: colors.border },
                                        selectedIds.has(q.id) && { backgroundColor: isDark ? '#1e3a8a' : '#dbeafe', borderColor: colors.tint }
                                    ]}
                                    onPress={() => toggleSelection(q.id)}
                                >
                                    <View style={[styles.checkbox, selectedIds.has(q.id) && { backgroundColor: colors.tint, borderColor: colors.tint }]}>
                                        {selectedIds.has(q.id) && <Ionicons name="checkmark" size={14} color="#fff" />}
                                    </View>
                                    <Text style={[styles.questionText, { color: colors.text }]} numberOfLines={2}>
                                        {q.text}
                                    </Text>
                                    <View style={[styles.badge, { backgroundColor: '#f1f5f9' }]}>
                                        <Text style={styles.badgeText}>{q.type.replace('_', ' ')}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                            {bankQuestions.length === 0 && (
                                <Text style={{ color: colors.text, textAlign: 'center', padding: 20 }}>Bankada soru yok.</Text>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.createButton, { backgroundColor: colors.tint }, isLoading && { opacity: 0.7 }]}
                    onPress={handleCreate}
                    disabled={isLoading}
                >
                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.createButtonText}>Sınavı Oluştur ({selectedIds.size})</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    content: { padding: 16, paddingBottom: 100 },
    card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
    input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 12 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { fontSize: 15 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1 },
    createButton: { padding: 16, borderRadius: 12, alignItems: 'center' },
    createButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    tabs: { flexDirection: 'row', marginBottom: 16, backgroundColor: '#f1f5f9', borderRadius: 8, padding: 4 },
    tab: { flex: 1, padding: 8, alignItems: 'center', borderRadius: 6 },
    tabText: { fontWeight: '600' },
    statText: { textAlign: 'right', marginBottom: 8, fontSize: 13, fontWeight: '600' },
    randomContainer: { gap: 12 },
    button: { padding: 12, borderRadius: 8, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: '600' },
    listContainer: { gap: 8 },
    questionItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1, gap: 12 },
    checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#94a3b8', alignItems: 'center', justifyContent: 'center' },
    questionText: { flex: 1, fontSize: 14 },
    badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    badgeText: { fontSize: 10, color: '#64748b' },
});
