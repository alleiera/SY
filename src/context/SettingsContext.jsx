import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { fetchUserSettings, saveUserSettings } from '../services/userSettingsService';

const SettingsContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    // --- Initial State from LocalStorage or Defaults ---
    const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'system');
    const [rowHeight, setRowHeight] = useState(() => parseInt(localStorage.getItem('app_rowHeight')) || 35);
    const [zebraStriping, setZebraStriping] = useState(() => localStorage.getItem('app_zebraStriping') !== 'false');
    const [showGridLines, setShowGridLines] = useState(() => localStorage.getItem('app_showGridLines') !== 'false');
    const [fontSize, setFontSize] = useState(() => localStorage.getItem('app_fontSize') || 'medium');
    const [reduceMotion, setReduceMotion] = useState(() => localStorage.getItem('app_reduceMotion') === 'true');

    const { user } = useAuth();

    // isHydrating: cloud'dan yükleme tamamlanana kadar cloud'a kaydetmeyi engeller.
    // setTimeout yerine promise çözümlemesiyle yönetilir — daha güvenilir.
    const isHydrating = useRef(true);

    // Debounce timer ref — her ayar değişikliğinde sıfırlanır
    const saveTimerRef = useRef(null);

    // --- 1. Cloud'dan Ayarları Yükle (Login sonrası) ---
    useEffect(() => {
        if (!user) {
            isHydrating.current = false;
            return;
        }

        isHydrating.current = true;

        const fetchSettings = async () => {
            try {
                const data = await fetchUserSettings(user.id);

                if (data) {
                    // Batch setState — tümü sync olarak aynı render döngüsünde uygulanır
                    if (data.theme)                          setTheme(data.theme);
                    if (data.row_height)                     setRowHeight(data.row_height);
                    if (data.zebra_striping  !== null)       setZebraStriping(data.zebra_striping);
                    if (data.show_grid_lines !== null)       setShowGridLines(data.show_grid_lines);
                    if (data.font_size)                      setFontSize(data.font_size);
                    if (data.reduce_motion   !== null)       setReduceMotion(data.reduce_motion);
                }
            } catch (err) {
                console.error('Error loading settings:', err);
            } finally {
                // State güncellemeleri React'te sync uygulandıktan sonra
                // bir sonraki microtask'ta hydration flag'i kaldır.
                // Bu, setTimeout(500ms) yaklaşımından çok daha güvenilir.
                Promise.resolve().then(() => {
                    isHydrating.current = false;
                });
            }
        };

        fetchSettings();
    }, [user]);

    // --- 2. LocalStorage'a Anında Kaydet, Cloud'a Debounce ile Kaydet ---
    useEffect(() => {
        // Her zaman localStorage'a yaz (anlık, senkron)
        localStorage.setItem('app_theme', theme);
        localStorage.setItem('app_rowHeight', rowHeight);
        localStorage.setItem('app_zebraStriping', zebraStriping);
        localStorage.setItem('app_showGridLines', showGridLines);
        localStorage.setItem('app_fontSize', fontSize);
        localStorage.setItem('app_reduceMotion', reduceMotion);

        // Tema DOM'a uygula
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else if (theme === 'light') {
            root.classList.remove('dark');
        } else if (theme === 'system') {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark');
            else root.classList.remove('dark');
        }

        // OS Tema Değişimlerini Dinle
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleThemeChange = (e) => {
            if (theme === 'system') {
                if (e.matches) root.classList.add('dark');
                else root.classList.remove('dark');
            }
        };
        mediaQuery.addEventListener('change', handleThemeChange);

        // Hydration sırasında veya kullanıcı yoksa cloud'a kaydetme
        if (!user || isHydrating.current) {
            return () => {
                mediaQuery.removeEventListener('change', handleThemeChange);
            };
        }

        // Önceki bekleyen timer'ı iptal et (debounce)
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

        // 800ms sonra cloud'a kaydet — hızlı ardışık değişimlerde sadece son değer gönderilir
        saveTimerRef.current = setTimeout(async () => {
            try {
                await saveUserSettings(user.id, {
                    theme,
                    rowHeight,
                    zebraStriping,
                    showGridLines,
                    fontSize,
                    reduceMotion,
                });
            } catch (err) {
                console.error('Error saving settings to cloud:', err);
            }
        }, 800);

        // Cleanup: bileşen unmount'ta bekleyen timer'ı temizle ve event listener'ı kaldır
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            mediaQuery.removeEventListener('change', handleThemeChange);
        };
    }, [theme, rowHeight, zebraStriping, showGridLines, fontSize, reduceMotion, user]);

    const value = {
        theme, setTheme,
        rowHeight, setRowHeight,
        zebraStriping, setZebraStriping,
        showGridLines, setShowGridLines,
        fontSize, setFontSize,
        reduceMotion, setReduceMotion,
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};
