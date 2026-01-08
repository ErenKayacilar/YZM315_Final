import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';

interface ScanResult {
    success: boolean;
    message?: string;
    examId?: number;
    examTitle?: string;
    studentId: string;
    studentName?: string;
    answerKey?: { [key: string]: string };
    studentAnswers?: { [key: string]: string };
    totalQuestions: number;
    correctAnswers: number;
    score: number;
    confidence: number;
    imageUrl?: string;
    requiresManualInput?: boolean;
    formDetected?: boolean;
}

export default function ScanResultScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { isDark } = useTheme();
    const colors = Colors[isDark ? 'dark' : 'light'];

    const [isSaving, setIsSaving] = useState(false);

    const scanData: ScanResult = params.data
        ? JSON.parse(params.data as string)
        : {
            success: false,
            studentId: '',
            totalQuestions: 0,
            correctAnswers: 0,
            score: 0,
            confidence: 0,
        };

    const imageUri = params.imageUri as string;
    const examTitle = params.examTitle as string || scanData.examTitle;

    const [editedStudentId, setEditedStudentId] = useState(scanData.studentId);
    const [editedScore, setEditedScore] = useState(scanData.score.toString());

    const handleSave = async () => {
        if (!editedStudentId.trim()) {
            Alert.alert('Hata', 'Lütfen öğrenci numarasını girin.');
            return;
        }

        try {
            setIsSaving(true);

            // In production, this would save to a grades endpoint
            await new Promise(resolve => setTimeout(resolve, 1000));

            Alert.alert(
                'Başarılı',
                `Öğrenci ${editedStudentId} için sonuç kaydedildi.\nPuan: ${editedScore}`,
                [
                    {
                        text: 'Tamam',
                        onPress: () => router.replace('/(instructor)/exams' as any),
                    },
                ]
            );
        } catch (error) {
            Alert.alert('Hata', 'Kaydetme sırasında bir hata oluştu.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRescan = () => {
        router.back();
    };

    const getAnswerStyle = (questionNum: string) => {
        if (!scanData.answerKey || !scanData.studentAnswers) return null;
        const studentAnswer = scanData.studentAnswers[questionNum];
        const correctAnswer = scanData.answerKey[questionNum];
        return studentAnswer === correctAnswer ? 'correct' : 'incorrect';
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={handleRescan} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        Tarama Sonucu
                    </Text>
                    {examTitle && (
                        <Text style={[styles.headerSubtitle, { color: colors.tint }]} numberOfLines={1}>
                            {examTitle}
                        </Text>
                    )}
                </View>
                <View style={styles.headerButton} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {/* Image Preview */}
                {imageUri && (
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: imageUri }} style={styles.previewImage} />
                        <View style={[styles.formDetectedBadge, { backgroundColor: '#22c55e' }]}>
                            <Ionicons name="checkmark-circle" size={16} color="white" />
                            <Text style={styles.formDetectedText}>Form Tespit Edildi</Text>
                        </View>
                    </View>
                )}

                {/* Score Summary */}
                <View style={[styles.scoreCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.scoreCircle}>
                        <Text style={[styles.scoreValue, { color: scanData.score >= 60 ? '#22c55e' : '#ef4444' }]}>
                            {scanData.score}
                        </Text>
                        <Text style={[styles.scoreLabel, { color: colors.text }]}>Puan</Text>
                    </View>
                    <View style={styles.scoreDetails}>
                        <View style={styles.scoreRow}>
                            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                            <Text style={[styles.scoreRowText, { color: colors.text }]}>
                                {scanData.correctAnswers} Doğru
                            </Text>
                        </View>
                        <View style={styles.scoreRow}>
                            <Ionicons name="close-circle" size={20} color="#ef4444" />
                            <Text style={[styles.scoreRowText, { color: colors.text }]}>
                                {scanData.totalQuestions - scanData.correctAnswers} Yanlış
                            </Text>
                        </View>
                        <View style={styles.scoreRow}>
                            <Ionicons name="help-circle" size={20} color={colors.tint} />
                            <Text style={[styles.scoreRowText, { color: colors.text }]}>
                                {scanData.totalQuestions} Toplam Soru
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Student Info */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="person" size={24} color={colors.tint} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>
                            Öğrenci Bilgileri
                        </Text>
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: colors.text }]}>Öğrenci No *</Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: colors.background,
                                color: colors.text,
                                borderColor: colors.border,
                            }]}
                            value={editedStudentId}
                            onChangeText={setEditedStudentId}
                            placeholder="Öğrenci numarasını girin"
                            placeholderTextColor="#9ca3af"
                            keyboardType="number-pad"
                        />
                    </View>
                </View>

                {/* Answer Comparison */}
                {scanData.answerKey && scanData.studentAnswers && (
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="list" size={24} color={colors.tint} />
                            <Text style={[styles.cardTitle, { color: colors.text }]}>
                                Cevap Karşılaştırması
                            </Text>
                        </View>
                        <View style={styles.answersGrid}>
                            {Object.keys(scanData.answerKey).map((qNum) => {
                                const isCorrect = getAnswerStyle(qNum) === 'correct';
                                const studentAnswer = scanData.studentAnswers![qNum];
                                const correctAnswer = scanData.answerKey![qNum];

                                return (
                                    <View
                                        key={qNum}
                                        style={[
                                            styles.answerItem,
                                            {
                                                backgroundColor: isCorrect
                                                    ? 'rgba(34, 197, 94, 0.15)'
                                                    : 'rgba(239, 68, 68, 0.15)',
                                            }
                                        ]}
                                    >
                                        <Text style={[styles.answerQuestion, { color: colors.text }]}>
                                            S{qNum}
                                        </Text>
                                        <View style={styles.answerValues}>
                                            <Text style={[
                                                styles.answerStudent,
                                                { color: isCorrect ? '#22c55e' : '#ef4444' }
                                            ]}>
                                                {studentAnswer || '-'}
                                            </Text>
                                            {!isCorrect && (
                                                <Text style={styles.answerCorrect}>
                                                    ({correctAnswer})
                                                </Text>
                                            )}
                                        </View>
                                        <Ionicons
                                            name={isCorrect ? 'checkmark' : 'close'}
                                            size={16}
                                            color={isCorrect ? '#22c55e' : '#ef4444'}
                                        />
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={[styles.actions, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.secondaryButton, { borderColor: colors.border }]}
                    onPress={handleRescan}
                >
                    <Ionicons name="refresh" size={20} color={colors.text} />
                    <Text style={[styles.actionButtonText, { color: colors.text }]}>
                        Tekrar Tara
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.primaryButton, { backgroundColor: colors.tint }]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <>
                            <Ionicons name="checkmark" size={20} color="white" />
                            <Text style={[styles.actionButtonText, { color: 'white' }]}>
                                Kaydet
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    headerButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    headerSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 120,
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    previewImage: {
        width: 180,
        height: 120,
        borderRadius: 12,
        backgroundColor: '#e5e7eb',
    },
    formDetectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginTop: 8,
    },
    formDetectedText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    scoreCard: {
        flexDirection: 'row',
        borderRadius: 16,
        borderWidth: 1,
        padding: 20,
        marginBottom: 16,
    },
    scoreCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreValue: {
        fontSize: 36,
        fontWeight: '700',
    },
    scoreLabel: {
        fontSize: 14,
        marginTop: 2,
    },
    scoreDetails: {
        flex: 1,
        marginLeft: 20,
        justifyContent: 'center',
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    scoreRowText: {
        fontSize: 15,
        marginLeft: 8,
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginBottom: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    inputGroup: {
        marginBottom: 8,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    answersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    answerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        minWidth: 90,
    },
    answerQuestion: {
        fontSize: 13,
        fontWeight: '500',
        marginRight: 8,
    },
    answerValues: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    answerStudent: {
        fontSize: 16,
        fontWeight: '700',
    },
    answerCorrect: {
        fontSize: 12,
        color: '#22c55e',
        marginLeft: 4,
    },
    actions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: 16,
        paddingBottom: 32,
        borderTopWidth: 1,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        marginHorizontal: 4,
    },
    primaryButton: {},
    secondaryButton: {
        borderWidth: 1,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});
