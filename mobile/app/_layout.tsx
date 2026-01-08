import { ThemeProvider as NavigationThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native'; // Rename to avoid conflict
import { ThemeProvider, useTheme } from '@/context/ThemeContext'; // Import our new context
import { Stack, useRouter, useSegments } from 'expo-router';
import { Role } from '@/types';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import * as SplashScreen from 'expo-splash-screen';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '@/i18n/i18n';

function AuthNavigatorWithTheme() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { isDark } = useTheme();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inInstructorGroup = segments[0] === '(instructor)';
    const inStudentGroup = segments[0] === '(student)';
    const inAdminGroup = segments[0] === '(admin)';

    // Allow root-level modal screens (optical-scan, optical-result, edit-profile, modal)
    const isRootModalScreen = ['optical-scan', 'optical-result', 'edit-profile', 'modal'].includes(segments[0] as string);

    if (!user) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else {
      const isInstructor = user.role === Role.INSTRUCTOR;
      const isAdmin = user.role === Role.ADMIN;

      // Don't redirect if user is on a root modal screen
      if (isRootModalScreen) {
        return;
      }

      if (inAuthGroup) {
        if (isAdmin) {
          router.replace('/(admin)' as any);
        } else if (isInstructor) {
          router.replace('/(instructor)' as any);
        } else {
          router.replace('/(student)' as any);
        }
      } else if (isAdmin && !inAdminGroup) {
        router.replace('/(admin)' as any);
      } else if (isInstructor && inInstructorGroup) {
        // Already correct
      } else if (isInstructor && !inInstructorGroup && !inAdminGroup) {
        router.replace('/(instructor)' as any);
      } else if (!isInstructor && !isAdmin && inInstructorGroup) {
        router.replace('/(student)' as any);
      } else if (!isAdmin && inAdminGroup) {
        // Kick non-admins out of admin group
        if (isInstructor) router.replace('/(instructor)' as any);
        else router.replace('/(student)' as any);
      }
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return null;
  }

  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(instructor)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(student)" />
        <Stack.Screen name="edit-profile" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="optical-scan" options={{ presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="optical-result" options={{ presentation: 'card', headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <AuthNavigatorWithTheme />
      </ThemeProvider>
    </AuthProvider>
  );
}
