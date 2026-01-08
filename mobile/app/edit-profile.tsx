import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Image,
    ActivityIndicator,
    Platform,
} from 'react-native'; // Removed 'Image' from here and added to imports in next block to avoid dupes if not careful, but this is a new file so it's fine.
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

import { useAuth, api } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function EditProfileScreen() {
    const { user, refreshUser } = useAuth(); // Assuming refreshUser exists or I might need to reload. 
    // If refreshUser doesn't exist on AuthContext, I might need to manually update state if possible or just rely on next fetch.
    // I'll check AuthContext later. For now assume I can just update local user or re-fetch.

    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
    const [password, setPassword] = useState('');
    const [profileImage, setProfileImage] = useState(user?.profileImage || null);

    // For storing selected file to upload
    const [selectedImage, setSelectedImage] = useState<any>(null);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setPhoneNumber(user.phoneNumber || '');
            setProfileImage(user.profileImage || null);
        }
    }, [user]);

    const pickImage = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/png', 'image/jpeg', 'image/jpg'],
                copyToCacheDirectory: true,
            });

            if (result.assets && result.assets[0]) {
                const asset = result.assets[0];
                setSelectedImage(asset);
                setProfileImage(asset.uri); // Preview
            }
        } catch (err) {
            console.log("Error picking document:", err);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            let imageUrl = profileImage;

            // Upload image if selected
            if (selectedImage) {
                const formData = new FormData();
                // We need to pass schema compatible object for React Native FormData
                // It expects { uri, name, type }
                const fileToUpload = {
                    uri: selectedImage.uri,
                    name: selectedImage.name || 'profile.jpg',
                    type: selectedImage.mimeType || 'image/jpeg',
                } as any;

                formData.append('file', fileToUpload);

                const uploadRes = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                imageUrl = uploadRes.data.url;
            }

            // Update profile
            const updateData: any = {
                name,
                email,
                phoneNumber,
                profileImage: imageUrl,
            };

            if (password && password.length > 0) {
                updateData.password = password;
            }

            await api.put('/users/profile', updateData);

            // Refresh user context to reflect changes across the app
            if (refreshUser) {
                await refreshUser();
            }

            Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi.', [
                { text: 'Tamam', onPress: () => router.back() }
            ]);

        } catch (error) {
            console.error('Update profile error:', error);
            Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Profili Düzenle</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                {/* Avatar Section */}
                <View style={styles.avatarContainer}>
                    <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                        {profileImage ? (
                            <Image source={{ uri: profileImage }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: `${colors.tint}20` }]}>
                                <Text style={[styles.avatarText, { color: colors.tint }]}>
                                    {name?.[0]?.toUpperCase() || '?'}
                                </Text>
                            </View>
                        )}
                        <View style={[styles.cameraIcon, { backgroundColor: colors.tint }]}>
                            <Ionicons name="camera" size={16} color="white" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Ad Soyad</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                            value={name}
                            onChangeText={setName}
                            placeholder="Adınız Soyadınız"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>E-posta</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="ornek@email.com"
                            placeholderTextColor="#9ca3af"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Telefon Numarası</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            placeholder="+90 555 555 55 55"
                            placeholderTextColor="#9ca3af"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Şifre (Değiştirmek istemiyorsanız boş bırakın)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Yeni şifre"
                            placeholderTextColor="#9ca3af"
                            secureTextEntry={true}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: colors.tint }]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.saveButtonText}>Kaydet</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: Platform.OS === 'android' ? 40 : 16,
    },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    content: { padding: 20 },
    avatarContainer: { alignItems: 'center', marginBottom: 24 },
    avatarWrapper: { position: 'relative' },
    avatar: { width: 100, height: 100, borderRadius: 50 },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: { fontSize: 40, fontWeight: '700' },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    form: { gap: 16 },
    inputGroup: { gap: 8 },
    label: { fontSize: 14, fontWeight: '600' },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    saveButton: {
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
});
