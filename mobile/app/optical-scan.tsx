import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';

import { api } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCAN_AREA_WIDTH = SCREEN_WIDTH * 0.85;
const SCAN_AREA_HEIGHT = SCREEN_HEIGHT * 0.5;

export default function ScanScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { isDark } = useTheme();
    const colors = Colors[isDark ? 'dark' : 'light'];

    // Get examId and examTitle from navigation params
    const examId = params.examId as string;
    const examTitle = params.examTitle as string;

    const [permission, requestPermission] = useCameraPermissions();
    const [flashOn, setFlashOn] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const cameraRef = useRef<CameraView>(null);

    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, []);

    const takePicture = async () => {
        if (!cameraRef.current || isProcessing) return;

        // Validate examId
        if (!examId) {
            Alert.alert(
                'Hata',
                'Sınav bilgisi bulunamadı. Lütfen sınav listesinden bir sınav seçerek tekrar deneyin.',
                [{ text: 'Tamam', onPress: () => router.back() }]
            );
            return;
        }

        try {
            setIsProcessing(true);

            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                base64: false,
            });

            if (!photo?.uri) {
                throw new Error('Failed to capture image');
            }

            const manipulatedImage = await ImageManipulator.manipulateAsync(
                photo.uri,
                [{ resize: { width: 1024 } }],
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
            );

            const formData = new FormData();
            formData.append('image', {
                uri: manipulatedImage.uri,
                name: 'scan.jpg',
                type: 'image/jpeg',
            } as any);
            formData.append('examId', examId);

            const response = await api.post('/optical-reader/process', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data.success) {
                router.push({
                    pathname: '/optical-result',
                    params: {
                        data: JSON.stringify(response.data),
                        imageUri: manipulatedImage.uri,
                        examId: examId,
                        examTitle: examTitle,
                    },
                } as any);
            } else {
                Alert.alert(
                    'Optik Form Bulunamadı',
                    response.data.message || 'Lütfen geçerli bir optik form tarayın.',
                    [{ text: 'Tamam' }]
                );
            }
        } catch (error: any) {
            console.error('Scan error:', error);
            if (error.message === 'Network Error') {
                Alert.alert(
                    'Bağlantı Hatası',
                    'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.',
                    [{ text: 'Tamam' }]
                );
            } else {
                Alert.alert('Hata', 'Tarama sırasında bir hata oluştu.');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    if (!permission) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                <Ionicons name="camera-outline" size={64} color={colors.tint} />
                <Text style={[styles.permissionText, { color: colors.text }]}>
                    Kamera izni gerekli
                </Text>
                <Text style={[styles.permissionSubtext, { color: colors.text }]}>
                    Optik form taramak için kamera erişimi gereklidir.
                </Text>
                <TouchableOpacity
                    style={[styles.permissionButton, { backgroundColor: colors.tint }]}
                    onPress={requestPermission}
                >
                    <Text style={styles.permissionButtonText}>İzin Ver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Camera */}
            <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFillObject}
                facing="back"
                flash={flashOn ? 'on' : 'off'}
            />

            {/* Overlay - Outside CameraView to avoid warning */}
            <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="close" size={28} color="white" />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Optik Okuyucu</Text>
                        {examTitle && (
                            <Text style={styles.headerSubtitle} numberOfLines={1}>
                                {examTitle}
                            </Text>
                        )}
                    </View>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => setFlashOn(!flashOn)}
                    >
                        <Ionicons
                            name={flashOn ? 'flash' : 'flash-off'}
                            size={24}
                            color="white"
                        />
                    </TouchableOpacity>
                </View>

                {/* Scan Frame Overlay */}
                <View style={styles.overlay}>
                    <View style={styles.overlayDark} />
                    <View style={styles.overlayMiddle}>
                        <View style={styles.overlayDarkSide} />
                        <View style={styles.scanArea}>
                            <View style={[styles.corner, styles.cornerTL]} />
                            <View style={[styles.corner, styles.cornerTR]} />
                            <View style={[styles.corner, styles.cornerBL]} />
                            <View style={[styles.corner, styles.cornerBR]} />
                        </View>
                        <View style={styles.overlayDarkSide} />
                    </View>
                    <View style={styles.overlayDark} />
                </View>

                {/* Instructions */}
                <View style={styles.instructions}>
                    <Text style={styles.instructionText}>
                        📋 Optik formu çerçeve içine hizalayın
                    </Text>
                </View>

                {/* Capture Button */}
                <View style={styles.controls}>
                    <TouchableOpacity
                        style={[
                            styles.captureButton,
                            isProcessing && styles.captureButtonDisabled,
                        ]}
                        onPress={takePicture}
                        disabled={isProcessing}
                    >
                        <View style={styles.captureButtonInner} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Processing Overlay */}
            {isProcessing && (
                <View style={styles.processingOverlay}>
                    <ActivityIndicator size="large" color="white" />
                    <Text style={styles.processingText}>
                        Form Analiz Ediliyor...
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 8,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        marginTop: 2,
    },
    overlay: {
        flex: 1,
    },
    overlayDark: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    overlayMiddle: {
        flexDirection: 'row',
        height: SCAN_AREA_HEIGHT,
    },
    overlayDarkSide: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    scanArea: {
        width: SCAN_AREA_WIDTH,
        height: SCAN_AREA_HEIGHT,
        borderWidth: 3,
        borderColor: '#22c55e',
        borderRadius: 12,
    },
    corner: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderColor: '#22c55e',
    },
    cornerTL: {
        top: -3,
        left: -3,
        borderTopWidth: 5,
        borderLeftWidth: 5,
        borderTopLeftRadius: 12,
    },
    cornerTR: {
        top: -3,
        right: -3,
        borderTopWidth: 5,
        borderRightWidth: 5,
        borderTopRightRadius: 12,
    },
    cornerBL: {
        bottom: -3,
        left: -3,
        borderBottomWidth: 5,
        borderLeftWidth: 5,
        borderBottomLeftRadius: 12,
    },
    cornerBR: {
        bottom: -3,
        right: -3,
        borderBottomWidth: 5,
        borderRightWidth: 5,
        borderBottomRightRadius: 12,
    },
    instructions: {
        position: 'absolute',
        bottom: 160,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    instructionText: {
        color: 'white',
        fontSize: 16,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        overflow: 'hidden',
    },
    controls: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'white',
    },
    captureButtonDisabled: {
        opacity: 0.5,
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'white',
    },
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    processingText: {
        color: 'white',
        fontSize: 18,
        marginTop: 16,
        fontWeight: '600',
    },
    permissionText: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
        textAlign: 'center',
    },
    permissionSubtext: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
        opacity: 0.7,
    },
    permissionButton: {
        marginTop: 24,
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 24,
    },
    permissionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
