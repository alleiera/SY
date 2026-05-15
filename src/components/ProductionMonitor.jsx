import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Activity,
    Layers,
    Play,
    Pause,
    StopCircle,
    RefreshCw,
    Cloud,
    Gauge,
    Bell,
    Plus,
    GripVertical,
    Cpu,
    Monitor,
    Clock,
    Factory
} from 'lucide-react';

import { fetchMachinesByType } from '../services/machineService';
import { fetchJobs, addJob } from '../services/jobService';
import { useSettings } from '../context/SettingsContext';
import AddJobModal from './ProductionMonitor/AddJobModal';

const ProductionMonitor = ({ machineType }) => {
    const { theme } = useSettings();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    // --- DURUM YÖNETİMİ ---
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeMachineId, setActiveMachineId] = useState(null);
    const [sidebarWidth, setSidebarWidth] = useState(300);
    const [isResizing, setIsResizing] = useState(false);
    const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);
    const mainContainerRef = useRef(null);

    // Veri Çekme
    const fetchMachines = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchMachinesByType(machineType);
            const allJobs = await fetchJobs(machineType);

            // Makine verisini state'e al — iş/metrik bilgisi DB'den gelmediği için
            // gerçek entegrasyon yapılana kadar null bırakılıyor.
            const formattedMachines = data.map(m => {
                const machineJobs = allJobs.filter(j => j.machineId === m.id).sort((a,b) => a.displayOrder - b.displayOrder);
                return {
                    ...m,
                    status: m.status || 'idle',
                    // currentJob: null olduğunda ekran "Aktif İş Yok" durumunu gösterir
                    currentJob: m.current_job_id ? m.current_job : null,
                    // metrics: null olduğunda ekran metrik göstermez
                    metrics: m.metrics || null,
                    // pendingJobs: gerçek iş kuyruğu DB'den gelmeli
                    pendingJobs: machineJobs
                };
            });

            setMachines(formattedMachines);
            if (formattedMachines.length > 0) setActiveMachineId(formattedMachines[0].id);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }, [machineType]);

    useEffect(() => {
        fetchMachines();
    }, [fetchMachines]);

    const activeMachine = machines.find(m => m.id === activeMachineId) || machines[0];

    // --- İŞLEYİCİLER ---
    const toggleMachineStatus = (id) => {
        setMachines(prev => prev.map(m =>
            m.id === id ? { ...m, status: m.status === 'running' ? 'paused' : 'running' } : m
        ));
    };

    const handleAddJob = async (jobData) => {
        try {
            await addJob(machineType, jobData);
            await fetchMachines();
        } catch (error) {
            console.error("İş eklenirken hata:", error);
            alert("İş eklenemedi: " + error.message);
        }
    };

    const startResizing = useCallback((e) => {
        setIsResizing(true);
        e.preventDefault();
    }, []);

    const stopResizing = useCallback(() => setIsResizing(false), []);

    const getClientX = (e) => {
        if (e.touches && e.touches.length > 0) return e.touches[0].clientX;
        if (e.changedTouches && e.changedTouches.length > 0) return e.changedTouches[0].clientX;
        return e.clientX;
    };

    const resize = useCallback((e) => {
        if (isResizing && mainContainerRef.current) {
            const clientX = getClientX(e);
            const containerRect = mainContainerRef.current.getBoundingClientRect();
            const containerWidth = containerRect.width;
            const newWidth = containerRect.right - clientX;

            // Min 220px, Max 75% of screen
            const minWidth = Math.max(220, containerWidth * 0.25);
            const maxWidth = containerWidth * 0.75;

            if (newWidth >= minWidth && newWidth <= maxWidth) {
                setSidebarWidth(newWidth);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
            window.addEventListener('touchmove', resize, { passive: false });
            window.addEventListener('touchend', stopResizing);
            window.addEventListener('touchcancel', stopResizing);
        } else {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
            window.removeEventListener('touchmove', resize);
            window.removeEventListener('touchend', stopResizing);
            window.removeEventListener('touchcancel', stopResizing);
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
            window.removeEventListener('touchmove', resize);
            window.removeEventListener('touchend', stopResizing);
            window.removeEventListener('touchcancel', stopResizing);
        };
    }, [isResizing, resize, stopResizing]);

    // Canlı Metrik Simülasyonu
    const isSimulationMode = machines.some(m => m.metrics === null);
    useEffect(() => {
        if (!isSimulationMode) return; // Gerçek veri varsa simülasyon çalıştırma
        const interval = setInterval(() => {
            setMachines(prev => prev.map(m => {
                if (m.status !== 'running') return m;
                const baseMetrics = m.metrics || { rpm: 12000, temp: 140, pressure: 2.2 };
                return {
                    ...m,
                    metrics: {
                        rpm: Math.floor(baseMetrics.rpm + (Math.random() * 40 - 20)),
                        temp: parseFloat((baseMetrics.temp + (Math.random() * 0.2 - 0.1)).toFixed(1)),
                        pressure: parseFloat((baseMetrics.pressure + (Math.random() * 0.04 - 0.02)).toFixed(2))
                    }
                };
            }));
        }, 1000);
        return () => clearInterval(interval);
    }, [isSimulationMode]);

    if (loading) return (
        <div className={`h-full w-full flex items-center justify-center ${isDark ? 'bg-[#181818]' : 'bg-gray-50'}`}>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#137fec]"></div>
        </div>
    );

    if (machines.length === 0) return (
        <div className={`h-full w-full flex flex-col items-center justify-center p-12 text-center ${isDark ? 'bg-[#181818]' : 'bg-gray-50'}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                <Factory size={40} className={isDark ? 'text-gray-600' : 'text-gray-300'} />
            </div>
            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Henüz Makine Tanımlanmamış</h3>
            <p className={`max-w-md ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Admin panelinden bu bölüm için makineleri tanımladığınızda burada görünecektir.</p>
        </div>
    );

    return (
        <div className={`font-sans h-full w-full overflow-hidden flex flex-col select-none ${isResizing ? 'cursor-col-resize' : ''} ${isDark ? 'bg-[#121212] text-white' : 'bg-gray-100 text-gray-900'}`}>

            {/* Ana İçerik Alanı */}
            <div className={`flex-1 flex flex-col overflow-hidden ${isDark ? 'bg-[#181818]' : 'bg-gray-100'}`}>

                {/* YATAY MAKİNE SEKME ÇUBUĞU */}
                <div className={`px-4 pt-4 pb-2 border-b ${isDark ? 'bg-[#181818] border-[#333]/30' : 'bg-white border-gray-200'}`}>
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        {machines.map(m => (
                            <button
                                key={m.id}
                                onClick={() => setActiveMachineId(m.id)}
                                className={`flex-shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-200 text-left min-w-[180px] ${activeMachineId === m.id
                                    ? (isDark ? 'bg-[#1f2937] border-white/10 ring-1 ring-white/5 shadow-xl' : 'bg-blue-50 border-blue-200 shadow-md')
                                    : (isDark ? 'bg-[#222] border-transparent hover:bg-[#282828] text-white/40' : 'bg-gray-50 border-transparent hover:bg-gray-100 text-gray-400')
                                    }`}
                            >
                                <div className={`w-2.5 h-2.5 rounded-full ${m.status === 'running' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' :
                                    m.status === 'error' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' :
                                        'bg-yellow-500'
                                    }`}></div>
                                <div className="flex flex-col min-w-0">
                                    <span className={`text-[11px] font-bold truncate ${activeMachineId === m.id ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-white/60' : 'text-gray-400')}`}>
                                        {m.name}
                                    </span>
                                    <span className={`text-[9px] font-mono opacity-40 ${isDark ? '' : 'text-gray-500'}`}>{m.location || m.id}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Alt Panel: Aktif İş ve Bekleyen İşler */}
                <div ref={mainContainerRef} className="flex-1 flex overflow-hidden p-4 gap-0 relative">

                    {/* ORTA PANEL: Aktif İzleme */}
                    <div className={`flex-1 flex flex-col min-w-0 rounded-l-2xl border border-r-0 shadow-2xl overflow-hidden ${isDark ? 'bg-[#1f1f1f] border-[#333]' : 'bg-white border-gray-200'}`}>
                        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-[#333] bg-[#2b2b2b]/20' : 'border-gray-100 bg-gray-50'}`}>
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-[#137fec]/10 rounded-xl">
                                    <Cpu size={22} className="text-[#137fec]" />
                                </div>
                                <div>
                                    <h2 className={`text-sm font-bold leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>{activeMachine.name}</h2>
                                    <p className={`text-[10px] mt-1.5 uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{activeMachine.location}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {isSimulationMode && (
                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-widest">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                        Simülasyon Modu
                                    </span>
                                )}
                                <button onClick={() => toggleMachineStatus(activeMachine.id)} className={`px-4 py-1.5 rounded-full text-[10px] font-bold border transition-all ${activeMachine.status === 'running' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                                    }`}>
                                    {activeMachine.status === 'running' ? 'ÇALIŞIYOR' : activeMachine.status === 'idle' ? 'BOŞ' : 'DURAKLATILDI'}
                                </button>
                                <RefreshCw size={18} onClick={fetchMachines} className={`cursor-pointer ml-2 ${isDark ? 'text-white/20 hover:text-white' : 'text-gray-300 hover:text-gray-700'}`} />
                            </div>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
                            {/* Mevcut Üretim Kartı */}
                            {activeMachine.currentJob ? (
                                <div className={`p-8 rounded-2xl border relative overflow-hidden group ${isDark ? 'bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-white/5' : 'bg-gradient-to-br from-gray-50 to-white border-gray-200'}`}>
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Activity size={120} />
                                    </div>
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="space-y-6">
                                            <div>
                                                <span className="text-[10px] font-black text-[#137fec] uppercase tracking-[0.2em] mb-3 block">Aktif Üretim Emri</span>
                                                <h3 className={`text-4xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{activeMachine.currentJob.part}</h3>
                                                <div className="flex gap-4 mt-4">
                                                    <span className={`px-3 py-1 rounded-md text-[10px] font-bold border ${isDark ? 'bg-white/5 text-white/60 border-white/5' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>PARTİ: {activeMachine.currentJob.batch}</span>
                                                    <span className={`px-3 py-1 rounded-md text-[10px] font-bold border ${isDark ? 'bg-white/5 text-white/60 border-white/5' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>HEDEF: {activeMachine.currentJob.total}</span>
                                                </div>
                                            </div>
                                            <div className={`grid grid-cols-2 gap-8 pt-6 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                                                <div className="space-y-1.5">
                                                    <span className={`text-[9px] font-bold uppercase tracking-widest block ${isDark ? 'text-white/30' : 'text-gray-400'}`}>İşi Başlatan</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-[#137fec]/20 flex items-center justify-center text-[10px] font-bold text-[#137fec]">
                                                            {activeMachine.currentJob.operator?.charAt(0) || '?'}
                                                        </div>
                                                        <span className={`text-sm font-bold ${isDark ? 'text-white/90' : 'text-gray-800'}`}>{activeMachine.currentJob.operator || '—'}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <span className={`text-[9px] font-bold uppercase tracking-widest block ${isDark ? 'text-white/30' : 'text-gray-400'}`}>Başlangıç Zamanı</span>
                                                    <div className={`flex items-center gap-2 ${isDark ? 'text-white/90' : 'text-gray-800'}`}>
                                                        <Clock size={14} className="text-[#137fec]" />
                                                        <span className={`text-sm font-bold ${isDark ? 'text-white/90' : 'text-gray-800'}`}>{activeMachine.currentJob.startDate} — {activeMachine.currentJob.startTime}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Aktif iş yoksa boş durum */
                                <div className={`flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed ${isDark ? 'border-white/[0.07] text-gray-600' : 'border-gray-200 text-gray-300'}`}>
                                    <Monitor size={40} className="mb-4 opacity-30" />
                                    <p className={`text-sm font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Aktif İş Emri Yok</p>
                                    <p className={`text-[11px] mt-1 ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>Bu makineye henüz iş atanmamış.</p>
                                </div>
                            )}

                        </div>

                        {/* Operasyonel Butonlar */}
                        <div className={`p-4 border-t flex gap-4 ${isDark ? 'border-[#333] bg-[#2b2b2b]/10' : 'border-gray-100 bg-gray-50'}`}>
                            <button
                                onClick={() => toggleMachineStatus(activeMachine.id)}
                                className={`flex-1 py-3.5 rounded-xl font-black text-[11px] tracking-widest transition-all flex items-center justify-center gap-3 border ${activeMachine.status === 'running' ? (isDark ? 'bg-[#2b2b2b] hover:bg-white/5 border-white/10 text-yellow-400' : 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-600') : (isDark ? 'bg-green-600/10 hover:bg-green-600/20 border-green-500/20 text-green-400' : 'bg-green-50 hover:bg-green-100 border-green-200 text-green-600')}`}
                            >
                                {activeMachine.status === 'running' ? <><Pause size={18} /> DURAKLAT</> : <><Play size={18} /> ÇALIŞTIR</>}
                            </button>
                            <button className="flex-1 py-3.5 rounded-xl bg-red-900/10 hover:bg-red-900/20 text-red-500 border border-red-500/20 font-black text-[11px] tracking-widest flex items-center justify-center gap-3">
                                <StopCircle size={18} /> ACİL STOP
                            </button>
                        </div>
                    </div>

                    {/* Sürükleme Ayırıcı */}
                    <div
                        onMouseDown={startResizing}
                        onTouchStart={startResizing}
                        className={`w-3 cursor-col-resize hover:bg-[#137fec] transition-colors z-40 flex items-center justify-center ${isResizing ? 'bg-[#137fec]' : (isDark ? 'bg-[#333]' : 'bg-gray-200')}`}
                    >
                        <div className="w-0.5 h-8 bg-white/20 rounded-full"></div>
                    </div>

                    {/* SAĞ PANEL: İş Kuyruğu (Bekleyen İşler) */}
                    <div
                        style={{ width: `${sidebarWidth}px` }}
                        className={`flex flex-col flex-shrink-0 rounded-r-2xl border border-l-0 shadow-xl overflow-hidden ${isDark ? 'bg-[#1f1f1f] border-[#333]' : 'bg-white border-gray-200'}`}
                    >
                        {/* Header Bölümü */}
                        <div className={`px-5 py-4 border-b flex justify-between items-center ${isDark ? 'border-[#333] bg-[#2b2b2b]/20' : 'border-gray-100 bg-gray-50'}`}>
                            <h3 className={`text-[10px] font-black flex items-center gap-2 tracking-widest uppercase ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                                <Layers size={16} className={isDark ? 'text-white/20' : 'text-gray-300'} /> BEKLEYEN İŞLER
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className={`text-[9px] px-2 py-1 rounded-md font-mono font-bold ${isDark ? 'bg-white/5 text-white/40' : 'bg-gray-100 text-gray-400'}`}>
                                    {activeMachine.pendingJobs.length}
                                </span>
                                <button
                                    onClick={() => setIsAddJobModalOpen(true)}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#137fec] hover:bg-[#137fec]/80 text-white transition-all border border-white/10 shadow-lg shadow-[#137fec]/20"
                                >
                                    <Plus size={14} strokeWidth={3} />
                                </button>
                            </div>
                        </div>

                        {/* İş Listesi (Daha İnce Kartlar) */}
                        <div className={`flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar ${isDark ? 'bg-black/15' : 'bg-gray-50'}`}>
                            {activeMachine.pendingJobs.map((job) => (
                                <div
                                    key={job.id}
                                    className={`group border p-2.5 rounded-xl hover:border-[#137fec]/30 transition-all relative ${!job.next ? 'opacity-40' : 'shadow-md ring-1 ring-[#137fec]/10'} ${isDark ? 'bg-[#222] border-white/5' : 'bg-white border-gray-200'}`}
                                >
                                    {/* Aktiflik Çizgisi */}
                                    {job.next && <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#137fec] rounded-full"></div>}

                                    <div className="flex justify-between items-start mb-1.5">
                                        <span className={`text-[11px] font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{job.productName}</span>
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${job.status === 'running' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-white/5 text-white/30 border-white/5'}`}>
                                            {job.status === 'pending' ? 'BEKLİYOR' : job.status}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center mt-2">
                                        <div className={`flex flex-col gap-1 text-[9px] font-bold uppercase tracking-tight ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                                            <span className="flex items-center gap-1">HEDEF: <span className={isDark ? 'text-white/60' : 'text-gray-600'}>{job.quantity}</span></span>
                                            {(job.surface || job.thickness || job.coilWidth) && (
                                                <span className={`text-[8px] mt-0.5 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                                                    Özellik: {job.surface} {job.thickness} {job.coilWidth}
                                                </span>
                                            )}
                                        </div>
                                        <GripVertical size={12} className="text-white/10 group-hover:text-white/30 cursor-grab" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className={`text-[10px] py-1.5 px-5 flex items-center justify-between shrink-0 font-bold border-t ${isDark ? 'bg-[#1f1f1f] text-white border-[#333]' : 'bg-white text-gray-700 border-gray-200'}`}>
                <div className="flex items-center gap-6">
                    <span className={`flex items-center gap-2 uppercase ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
                        <Cloud size={14} />
                        {isSimulationMode ? 'SİMÜLASYON MODU — Gerçek veri bağlantısı bekleniyor' : 'SİSTEM BAĞLANTISI: ÇEVRİMİÇİ'}
                    </span>
                </div>
                <div className="flex items-center gap-5">
                    <div className={`flex items-center gap-2 px-3 py-0.5 rounded-full ${isDark ? 'bg-white/5 text-white/60' : 'bg-gray-100 text-gray-500'}`}>
                        <Bell size={12} /> <span>{machines.filter(m => m.status === 'error').length} ALARM</span>
                    </div>
                </div>
            </footer>

            <AddJobModal
                isOpen={isAddJobModalOpen}
                onClose={() => setIsAddJobModalOpen(false)}
                onSave={handleAddJob}
                machine={activeMachine}
                isDark={isDark}
            />
        </div>
    );
};

export default ProductionMonitor;
