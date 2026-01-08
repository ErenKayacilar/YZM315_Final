import { useTheme } from '@/context/ThemeContext';

export function useColorScheme() {
    try {
        const { isDark } = useTheme();
        return isDark ? 'dark' : 'light';
    } catch (e) {
        // Fallback for usage outside ThemeProvider or during initialization if any
        return 'dark';
    }
}
