import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Uygulama pencere yönetimini (açma, kapatma, sürükleme, boyutlandırma,
 * maximize/minimize, snap) tek yerden yönetir.
 *
 * App.jsx'in state ve event handler karmaşasını buraya taşıyarak
 * bileşenin yalnızca render'a odaklanması sağlanmıştır.
 */
export function useWindowManager() {
    const migrateWindows = useCallback((rawWindows) => {
        if (!Array.isArray(rawWindows)) return [];
        return rawWindows.map((w) => {
            if (w.type === 'production-monitor' && !w.machineType) {
                const title = (w.title || '').toLowerCase();
                if (title.includes('ekstruder')) return { ...w, machineType: 'extruder' };
                if (title.includes('desen')) return { ...w, machineType: 'pattern' };
                if (title.includes('kesim')) return { ...w, machineType: 'cutting' };
            }
            return w;
        });
    }, []);

    const [windows, setWindows] = useState(() => {
        const saved = localStorage.getItem('app_windows');
        return saved ? migrateWindows(JSON.parse(saved)) : [];
    });

    const [activeWindowId, setActiveWindowId] = useState(() => {
        const saved = localStorage.getItem('app_active_window');
        return saved ? JSON.parse(saved) : null;
    });

    const [dragInfo, setDragInfo] = useState(null);
    const [resizeInfo, setResizeInfo] = useState(null);
    const [snapPreview, setSnapPreview] = useState(null);
    const [recentlyDraggedWindowId, setRecentlyDraggedWindowId] = useState(null);
    const [workspaceDimensions, setWorkspaceDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });
    const [isMobile, setIsMobile] = useState(() => {
        const isTouch = window.matchMedia('(pointer: coarse)').matches;
        const isTouchDevice = navigator.maxTouchPoints > 0;
        return isTouch || isTouchDevice;
    });

    const workspaceRef = useRef(null);

    // Resize listener
    useEffect(() => {
        const handleResize = () => {
            const isTouch = window.matchMedia('(pointer: coarse)').matches;
            const isTouchDevice = navigator.maxTouchPoints > 0;
            setIsMobile(isTouch || isTouchDevice);
            if (workspaceRef.current) {
                setWorkspaceDimensions({
                    width: workspaceRef.current.clientWidth,
                    height: workspaceRef.current.clientHeight
                });
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // State Persistence
    useEffect(() => {
        localStorage.setItem('app_windows', JSON.stringify(windows));
        localStorage.setItem('app_active_window', JSON.stringify(activeWindowId));
    }, [windows, activeWindowId]);

    // --- PENCERE FONKSİYONLARI ---
    const focusWindow = useCallback((id) => {
        if (!id) return;
        setActiveWindowId(id);
        setWindows(prev => {
            const maxZ = Math.max(0, ...prev.map(w => w.z || 0));
            return prev.map(w => w.id === id ? { ...w, z: maxZ + 1, isMin: false } : w);
        });
    }, []);

    const minimizeAll = useCallback(() => {
        setWindows(prev => prev.map(w => ({ ...w, isMin: true })));
        setActiveWindowId(null);
    }, []);

    const minimizeWindow = useCallback((id, e) => {
        if (e) e.stopPropagation();
        setWindows(prev => prev.map(w => w.id === id ? { ...w, isMin: true } : w));
        setActiveWindowId(prev => prev === id ? null : prev);
    }, []);

    const openWindow = useCallback((title, type = 'generic', machineType = null, onMenuClose) => {
        setWindows(prev => {
            const existingWindow = prev.find(w => w.title === title);
            if (existingWindow) {
                focusWindow(existingWindow.id);
                if (onMenuClose) onMenuClose();
                return prev;
            }
            const id = Date.now();
            const maxZ = Math.max(0, ...prev.map(w => w.z || 0));
            const newWin = {
                id, title, type, machineType,
                x: 100, y: 100, w: 850, h: 550,
                z: maxZ + 1, isMax: false, isMin: false, pageSearch: ''
            };
            setActiveWindowId(id);
            if (onMenuClose) onMenuClose();
            return [...prev, newWin];
        });
    }, [focusWindow]);

    const closeWindow = useCallback((id, e) => {
        if (e) e.stopPropagation();
        setWindows(prev => {
            const nextWins = prev.filter(w => w.id !== id);
            setActiveWindowId(currentActive => {
                if (currentActive === id && nextWins.length > 0) {
                    const nextActive = nextWins.reduce((p, c) => ((p.z || 0) > (c.z || 0)) ? p : c);
                    return nextActive.id;
                }
                return currentActive === id ? null : currentActive;
            });
            return nextWins;
        });
    }, []);

    const toggleMaximize = useCallback((id, e) => {
        if (e) e.stopPropagation();
        setWindows(prev => prev.map(w => w.id === id ? { ...w, isMax: !w.isMax } : w));
        focusWindow(id);
    }, [focusWindow]);

    // --- MOUSE ETKİLEŞİMLERİ ---
    const handleMouseDown = useCallback((id, e) => {
        const isControl = e.target.closest('.nodrag')
            || e.target.closest('button')
            || e.target.closest('input')
            || e.target.closest('textarea')
            || e.target.closest('select');

        if (isControl) {
            focusWindow(id);
            return;
        }

        setWindows(prev => {
            const win = prev.find(w => w.id === id);
            if (!win || win.isMax) return prev;
            return prev; // sadece dragInfo için kullan
        });

        const win = windows.find(w => w.id === id);
        if (!win || win.isMax || isMobile) return;
        focusWindow(id);
        setDragInfo({
            id,
            startX: e.clientX,
            startY: e.clientY,
            initialX: win.x,
            initialY: win.y
        });
    }, [focusWindow, windows, isMobile]);

    const startResize = useCallback((id, direction, e) => {
        e.stopPropagation(); e.preventDefault();
        const win = windows.find(w => w.id === id);
        if (!win || win.isMax) return;
        focusWindow(id);
        setResizeInfo({
            id, direction,
            startX: e.clientX, startY: e.clientY,
            startW: win.w, startH: win.h,
            startXWin: win.x, startYWin: win.y
        });
    }, [focusWindow, windows]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (dragInfo) {
                // PERFORMANS: React state yerine DOM manipülasyonu (60fps için)
                const dx = e.clientX - dragInfo.startX;
                const dy = e.clientY - dragInfo.startY;

                const el = document.getElementById(`window-${dragInfo.id}`);
                if (el) {
                    el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
                }

                const snapT = 30;
                const sw = workspaceRef.current?.clientWidth || window.innerWidth;
                if (e.clientX < snapT) setSnapPreview('left');
                else if (e.clientX > sw - snapT) setSnapPreview('right');
                else setSnapPreview(null);

            } else if (resizeInfo) {
                const { id, direction, startX, startY, startW, startH, startXWin, startYWin } = resizeInfo;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                setWindows(prev => prev.map(w => {
                    if (w.id !== id) return w;
                    let nW = startW, nH = startH, nX = startXWin, nY = startYWin;
                    if (direction.includes('e')) nW = Math.max(400, startW + dx);
                    if (direction.includes('s')) nH = Math.max(300, startH + dy);
                    if (direction.includes('w') && (startW - dx) >= 400) { nW = startW - dx; nX = startXWin + dx; }
                    if (direction.includes('n') && (startH - dy) >= 300) { nH = startH - dy; nY = startYWin + dy; }
                    return { ...w, x: nX, y: nY, w: nW, h: nH };
                }));
            }
        };

        const handleMouseUp = (e) => {
            if (dragInfo) {
                const draggingId = dragInfo.id;
                setRecentlyDraggedWindowId(draggingId);

                const el = document.getElementById(`window-${draggingId}`);
                if (el) el.style.transform = 'none';

                if (snapPreview && workspaceRef.current) {
                    const sw = workspaceRef.current.clientWidth;
                    const sh = workspaceRef.current.clientHeight;
                    setWindows(prev => prev.map(w =>
                        w.id === draggingId
                            ? { ...w, x: snapPreview === 'left' ? 0 : sw / 2, y: 0, w: sw / 2, h: sh, isMax: false }
                            : w
                    ));
                } else {
                    const dx = e.clientX - dragInfo.startX;
                    const dy = e.clientY - dragInfo.startY;
                    setWindows(prev => prev.map(w =>
                        w.id === draggingId
                            ? { ...w, x: dragInfo.initialX + dx, y: dragInfo.initialY + dy }
                            : w
                    ));
                }

                setTimeout(() => setRecentlyDraggedWindowId(null), 50);
            }

            setDragInfo(null);
            setResizeInfo(null);
            setSnapPreview(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragInfo, resizeInfo, snapPreview]);

    return {
        // State
        windows,
        activeWindowId,
        dragInfo,
        resizeInfo,
        snapPreview,
        recentlyDraggedWindowId,
        workspaceDimensions,
        isMobile,
        workspaceRef,
        // Actions
        focusWindow,
        minimizeAll,
        minimizeWindow,
        openWindow,
        closeWindow,
        toggleMaximize,
        handleMouseDown,
        startResize,
    };
}
