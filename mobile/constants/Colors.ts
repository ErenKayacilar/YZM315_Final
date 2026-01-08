// Colors matching the web client's dark mode palette
const tintColorLight = '#6366f1'; // indigo-500
const tintColorDark = '#818cf8'; // indigo-400

export default {
  light: {
    text: '#1e293b', // slate-800
    background: '#f8fafc', // slate-50
    card: '#ffffff',
    border: '#e2e8f0', // slate-200
    tint: tintColorLight,
    tabIconDefault: '#94a3b8', // slate-400
    tabIconSelected: tintColorLight,
    inputBg: '#ffffff',
    inputBorder: '#e2e8f0',
    cardBackground: '#ffffff',
    textSecondary: '#64748b',
  },
  dark: {
    text: '#f1f5f9', // slate-100
    background: '#020617', // slate-950 (matching web)
    card: '#1e293b', // slate-800 (matching web)
    border: '#334155', // slate-700
    tint: tintColorDark,
    tabIconDefault: '#64748b', // slate-500
    tabIconSelected: tintColorDark,
    inputBg: '#0f172a', // slate-900
    inputBorder: '#334155', // slate-700
    cardBackground: '#1e293b',
    textSecondary: '#94a3b8',
  },
};

