import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

interface Note {
    id: number;
    content: string;
    createdAt: string;
}

export default function InstructorCourseNotesScreen() {
    const { t } = useTranslation();
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];
    const isDark = colorScheme === 'dark';

    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fetchNotes = async () => {
        try {
            const res = await api.get(`/courses/${id}/notes`);
            setNotes(res.data);
        } catch (error) {
            setNotes([]);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (id) fetchNotes();
    }, [id]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotes();
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        setIsSaving(true);
        try {
            await api.post(`/courses/${id}/notes`, { content: newNote.trim() });
            setNewNote('');
            fetchNotes();
        } catch (error) {
            Alert.alert('Hata', 'Not eklenemedi.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteNote = (noteId: number) => {
        Alert.alert('Notu Sil', 'Bu notu silmek istediğinize emin misiniz?', [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('common.delete'),
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/notes/${noteId}`);
                        fetchNotes();
                    } catch (error) {
                        Alert.alert('Hata', 'Not silinemedi.');
                    }
                },
            },
        ]);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={90}
        >
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t('course.notes')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />}
            >
                {notes.length === 0 ? (
                    <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Ionicons name="document-text-outline" size={48} color={isDark ? '#64748b' : '#94a3b8'} />
                        <Text style={[styles.emptyText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                            Henüz not eklenmemiş.
                        </Text>
                    </View>
                ) : (
                    notes.map((note) => (
                        <View key={note.id} style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={styles.noteHeader}>
                                <Text style={[styles.noteDate, { color: isDark ? '#94a3b8' : '#64748b' }]}>{formatDate(note.createdAt)}</Text>
                                <TouchableOpacity onPress={() => handleDeleteNote(note.id)}>
                                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.noteContent, { color: colors.text }]}>{note.content}</Text>
                        </View>
                    ))
                )}
            </ScrollView>

            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <TextInput
                    style={[styles.textInput, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: colors.text }]}
                    value={newNote}
                    onChangeText={setNewNote}
                    placeholder="Not ekle..."
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[styles.sendButton, { backgroundColor: colors.tint, opacity: newNote.trim() ? 1 : 0.5 }]}
                    onPress={handleAddNote}
                    disabled={!newNote.trim() || isSaving}
                >
                    {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={20} color="#fff" />}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
    headerTitle: { fontSize: 18, fontWeight: '600' },
    scrollView: { flex: 1 },
    scrollContent: { padding: 16 },
    emptyCard: { padding: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    emptyText: { fontSize: 15, marginTop: 12 },
    noteCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
    noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    noteDate: { fontSize: 12 },
    noteContent: { fontSize: 15, lineHeight: 22 },
    inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1, gap: 10 },
    textInput: { flex: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
    sendButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
});
