
import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as DocumentPicker from 'expo-document-picker';
import { api } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function CreateLessonScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { id, moduleId } = useLocalSearchParams<{ id: string; moduleId: string }>();
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];
    const isDark = colorScheme === 'dark';

    const [isLoading, setIsLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [type, setType] = useState<'VIDEO' | 'PDF' | 'LIVE_LINK' | 'TEXT'>('VIDEO');
    const [content, setContent] = useState(''); // URL or Text content
    const [selectedFile, setSelectedFile] = useState<any>(null);

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: type === 'PDF' ? 'application/pdf' : 'video/*',
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const asset = result.assets[0];
            setSelectedFile(asset);
        } catch (err) {
            console.error(err);
            Alert.alert('Hata', 'Dosya seçilemedi.');
        }
    };

    const handleCreate = async () => {
        if (!title.trim()) {
            Alert.alert('Hata', 'Ders başlığı gereklidir.');
            return;
        }

        setIsLoading(true);
        try {
            let finalUrl = content;

            // Handle File Upload
            if ((type === 'PDF' || type === 'VIDEO') && selectedFile) {
                const formData = new FormData();
                formData.append('file', {
                    uri: selectedFile.uri,
                    name: selectedFile.name,
                    type: selectedFile.mimeType || (type === 'PDF' ? 'application/pdf' : 'video/mp4'),
                } as any);

                const uploadRes = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                finalUrl = uploadRes.data.url;
            } else if ((type === 'PDF' || type === 'VIDEO') && !content) {
                // If PDF/VIDEO and no file/url
                Alert.alert('Hata', 'Lütfen bir dosya seçin veya URL girin.');
                setIsLoading(false);
                return;
            }

            // If LIVE_LINK or TEXT, use content state as is.

            await api.post(`/courses/modules/${moduleId}/lessons`, {
                title: title.trim(),
                type,
                url: finalUrl,
            });

            Alert.alert('Başarılı', 'Ders eklendi.');
            router.back();
        } catch (err: any) {
            console.error(err);
            Alert.alert('Hata', 'İşlem başarısız.');
        } finally {
            setIsLoading(false);
        }
    };

    const getTypeIcon = (t: string) => {
        switch (t) {
            case 'VIDEO': return 'videocam';
            case 'PDF': return 'document-text';
            case 'LIVE_LINK': return 'link';
            case 'TEXT': return 'text';
            default: return 'document';
        }
    };

    const getTypeLabel = (t: string) => {
        switch (t) {
            case 'VIDEO': return 'Video';
            case 'PDF': return 'PDF';
            case 'LIVE_LINK': return 'Canlı Ders / Link';
            case 'TEXT': return 'Metin';
            default: return t;
        }
    };

    const types: ('VIDEO' | 'PDF' | 'LIVE_LINK' | 'TEXT')[] = ['VIDEO', 'PDF', 'LIVE_LINK', 'TEXT'];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Yeni Ders Ekle</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Başlık</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: colors.text, borderColor: colors.border }]}
                        placeholder="Ders başlığı"
                        placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                        value={title}
                        onChangeText={setTitle}
                    />

                    <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>İçerik Türü</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeContainer}>
                        {types.map((t) => (
                            <TouchableOpacity
                                key={t}
                                style={[
                                    styles.typeButton,
                                    type === t && { backgroundColor: colors.tint, borderColor: colors.tint },
                                    { borderColor: colors.border }
                                ]}
                                onPress={() => { setType(t); setSelectedFile(null); setContent(''); }}
                            >
                                <Ionicons
                                    name={getTypeIcon(t)}
                                    size={18}
                                    color={type === t ? '#fff' : colors.text}
                                />
                                <Text style={[
                                    styles.typeText,
                                    { color: type === t ? '#fff' : colors.text }
                                ]}>
                                    {getTypeLabel(t)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>İçerik</Text>

                    {(type === 'PDF' || type === 'VIDEO') ? (
                        <View style={{ gap: 12 }}>
                            <TouchableOpacity
                                style={[styles.uploadButton, { borderColor: colors.tint, borderStyle: 'dashed' }]}
                                onPress={handlePickDocument}
                            >
                                <Ionicons name="cloud-upload-outline" size={32} color={colors.tint} />
                                <Text style={[styles.uploadText, { color: colors.tint }]}>
                                    {selectedFile ? selectedFile.name : (type === 'PDF' ? 'PDF Dosyası Seç' : 'Video Dosyası Seç')}
                                </Text>
                            </TouchableOpacity>
                            {selectedFile && (
                                <TouchableOpacity onPress={() => setSelectedFile(null)}>
                                    <Text style={{ color: '#ef4444', textAlign: 'center' }}>Dosyayı Kaldır</Text>
                                </TouchableOpacity>
                            )}
                            <Text style={[styles.orText, { color: isDark ? '#94a3b8' : '#64748b' }]}>VEYA URL Girin</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: colors.text, borderColor: colors.border }]}
                                placeholder="Dosya URL (Opsiyonel)"
                                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                value={content}
                                onChangeText={setContent}
                            />
                        </View>
                    ) : (
                        <TextInput
                            style={[
                                styles.input,
                                { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: colors.text, borderColor: colors.border },
                                type === 'TEXT' && { height: 100, textAlignVertical: 'top' }
                            ]}
                            placeholder={type === 'LIVE_LINK' ? 'Zoom/Meet Linki' : 'İçerik Metni'}
                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                            value={content}
                            onChangeText={setContent}
                            multiline={type === 'TEXT'}
                        />
                    )}

                </View>
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.createButton, { backgroundColor: colors.tint }, isLoading && { opacity: 0.7 }]}
                    onPress={handleCreate}
                    disabled={isLoading}
                >
                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.createButtonText}>Dersi Ekle</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    content: { padding: 16 },
    card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
    label: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
    input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1 },
    createButton: { padding: 16, borderRadius: 12, alignItems: 'center' },
    createButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    typeContainer: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
    typeButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, gap: 6 },
    typeText: { fontWeight: '600', fontSize: 13 },
    uploadButton: { borderWidth: 2, borderRadius: 12, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 8 },
    uploadText: { fontWeight: '600' },
    orText: { textAlign: 'center', fontSize: 12, marginVertical: 8 },
});
