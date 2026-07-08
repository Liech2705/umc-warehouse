import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import App from './App';
import './styles/tokens.css';
import './index.css';
import './styles/print.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function AppConfigProvider({ children }) {
  const { isDark } = useTheme();

  const themeConfig = {
    token: {
      colorPrimary: '#1E3A5F',
      colorInfo: '#2563EB',
      colorSuccess: '#10B981',
      colorWarning: '#F59E0B',
      colorError: '#EF4444',
      colorBgLayout: isDark ? '#0A0F1E' : '#F1F5F9',
      colorBgContainer: isDark ? '#111827' : '#FFFFFF',
      borderRadius: 8,
      borderRadiusLG: 12,
      borderRadiusSM: 6,
      fontFamily: "'Inter', -apple-system, 'Segoe UI', sans-serif",
      fontSize: 14,
      lineHeight: 1.5,
      colorText: isDark ? '#F1F5F9' : '#0F172A',
      colorTextSecondary: isDark ? '#94A3B8' : '#475569',
      colorTextTertiary: isDark ? '#475569' : '#94A3B8',
      colorBorder: isDark ? '#1E293B' : '#E2E8F0',
      colorSplit: isDark ? '#1E293B' : '#F1F5F9',
      boxShadow: isDark
        ? '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)'
        : '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
      boxShadowSecondary: isDark
        ? '0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -1px rgba(0,0,0,0.2)'
        : '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.05)',
    },
    components: {
      Table: {
        headerBg: isDark ? '#1F2937' : '#F8FAFC',
        headerBorderRadius: 0,
        rowHoverBg: isDark ? '#1F2937' : '#F8FAFC',
      },
      Card: {
        borderRadiusLG: 12,
        paddingLG: 20,
      },
      Button: {
        borderRadius: 8,
        borderRadiusSM: 6,
        borderRadiusLG: 8,
        controlHeight: 36,
        controlHeightLG: 42,
        controlHeightSM: 28,
        paddingContentHorizontal: 16,
      },
      Input: {
        borderRadius: 8,
        controlHeight: 36,
      },
      Select: {
        borderRadius: 8,
        controlHeight: 36,
      },
      DatePicker: {
        borderRadius: 8,
        controlHeight: 36,
      },
      Menu: {
        darkItemBg: 'transparent',
        darkSubMenuItemBg: 'rgba(0,0,0,0.15)',
        darkItemColor: 'rgba(255, 255, 255, 0.65)',
        darkItemHoverBg: 'rgba(255, 255, 255, 0.08)',
        darkItemSelectedBg: 'rgba(245, 158, 11, 0.15)',
        darkItemSelectedColor: '#FFFFFF',
        darkPopupBg: '#0F2040',
        itemBorderRadius: 8,
        itemMarginInline: 8,
      },
      Modal: {
        borderRadiusLG: 16,
      },
      Dropdown: {
        borderRadiusLG: 12,
        paddingBlock: 6,
      },
      Tag: {
        borderRadius: 9999,
      },
      Pagination: {
        borderRadius: 8,
      },
    },
  };

  return <ConfigProvider theme={themeConfig}>{children}</ConfigProvider>;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <AppConfigProvider>
              <App />
            </AppConfigProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
