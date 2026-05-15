import React from 'react';
import { useSettings } from '../context/SettingsContext';
import { Moon, Sun, Monitor, Layout, Check, Palette } from 'lucide-react';

const PREVIEW_ROWS = [
    { code: 'PRD-001', name: 'Meşe Profil', unit: 'Adet', stock: '2.450' },
    { code: 'PRD-014', name: 'Lake Panel', unit: 'Plaka', stock: '860' },
    { code: 'PRD-032', name: 'PVC Kenar', unit: 'Rulo', stock: '125' }
];

const SettingsWindow = () => {
    const {
        theme, setTheme,
        rowHeight, setRowHeight,
        zebraStriping, setZebraStriping,
        showGridLines, setShowGridLines,
        fontSize, setFontSize
    } = useSettings();

    const isDark = theme === 'dark';
    const previewFontClass = fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-base' : 'text-sm';

    const toggleTheme = () => {
        setTheme((prev) => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <div className={`h-full w-full p-8 overflow-y-auto custom-scrollbar ${isDark ? 'bg-[#181818] text-gray-200' : 'bg-white text-gray-800'}`}>
            <div className="max-w-5xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-3xl font-black mb-2 tracking-tight">Ayarlar</h1>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Uygulama deneyimini çalışma alışkanlığınıza göre düzenleyin.</p>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-10 items-start">
                    <div className="space-y-12">
                        <section>
                            <h2 className={`text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                <Palette size={16} /> Görünüm
                            </h2>

                            <div className={`rounded-xl border p-1 ${isDark ? 'bg-[#1f1f1f] border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                                <div className={`flex items-center justify-between p-4 rounded-lg transition-colors group ${isDark ? 'hover:bg-[#252525]' : 'hover:bg-white'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-blue-600/10 text-blue-500' : 'bg-gray-200 text-gray-600'}`}>
                                            {isDark ? <Moon size={20} /> : <Sun size={20} />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-base">Karanlık Mod</div>
                                            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Daha sakin bir çalışma ortamı için koyu renk paletini kullanın.</div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={toggleTheme}
                                        className={`w-14 h-7 rounded-full transition-all duration-300 relative focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDark ? 'bg-blue-600' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 flex items-center justify-center ${isDark ? 'left-8 scale-100' : 'left-1 scale-90'}`}>
                                            {isDark && <Moon size={10} className="text-blue-600" />}
                                        </div>
                                    </button>
                                </div>

                                <div className={`h-px mx-4 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />

                                <div className={`p-4 flex items-center justify-between rounded-lg transition-colors group ${isDark ? 'hover:bg-[#252525]' : 'hover:bg-white'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-[#252525] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                                            <span className="text-lg font-serif font-bold">Aa</span>
                                        </div>
                                        <div>
                                            <div className="font-bold text-base">Yazı Boyutu</div>
                                            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Ekrandaki metinlerin okunabilirliğini ihtiyacınıza göre ayarlayın.</div>
                                        </div>
                                    </div>
                                    <div className={`flex p-1 rounded-lg ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-200'}`}>
                                        {['small', 'medium', 'large'].map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setFontSize(size)}
                                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${fontSize === size
                                                    ? (isDark ? 'bg-[#2a2a2a] text-white' : 'bg-white text-black shadow-sm')
                                                    : (isDark ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700')}`}
                                            >
                                                {size === 'small' ? 'Küçük' : size === 'medium' ? 'Orta' : 'Büyük'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className={`text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                <Layout size={16} /> Tablo Düzeni
                            </h2>

                            <div className={`rounded-xl border p-6 space-y-8 ${isDark ? 'bg-[#1f1f1f] border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                                <div>
                                    <div className="flex justify-between items-end mb-4">
                                        <label className="font-bold text-base">Satır Yüksekliği</label>
                                        <span className={`text-sm font-mono px-2 py-0.5 rounded ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>{rowHeight}px</span>
                                    </div>
                                    <div className={`relative h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                        <div
                                            className="absolute top-0 left-0 h-full bg-blue-600 rounded-full"
                                            style={{ width: `${((rowHeight - 25) / (60 - 25)) * 100}%` }}
                                        />
                                        <input
                                            type="range"
                                            min="25"
                                            max="60"
                                            value={rowHeight}
                                            onChange={(e) => setRowHeight(parseInt(e.target.value, 10))}
                                            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-600 rounded-full shadow cursor-grab active:cursor-grabbing pointer-events-none transition-all"
                                            style={{ left: `calc(${((rowHeight - 25) / (60 - 25)) * 100}% - 8px)` }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-2 text-xs text-gray-400 font-medium">
                                        <span>Sıkışık</span>
                                        <span>Rahat</span>
                                        <span>Geniş</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        onClick={() => setZebraStriping(!zebraStriping)}
                                        className={`cursor-pointer rounded-lg border-2 p-4 transition-all flex items-start gap-3 ${zebraStriping
                                            ? (isDark ? 'border-blue-500 bg-blue-900/10' : 'border-blue-500 bg-blue-50')
                                            : (isDark ? 'border-transparent bg-[#252525] hover:border-gray-600' : 'border-transparent bg-white hover:border-gray-300')}`}
                                    >
                                        <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${zebraStriping ? 'bg-blue-600 border-blue-600' : 'border-gray-400'}`}>
                                            {zebraStriping && <Check size={14} className="text-white" />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm">Zebra Deseni</div>
                                            <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Alternatif satır renkleriyle uzun listeleri daha rahat takip etmenizi sağlar.</div>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setShowGridLines(!showGridLines)}
                                        className={`cursor-pointer rounded-lg border-2 p-4 transition-all flex items-start gap-3 ${showGridLines
                                            ? (isDark ? 'border-blue-500 bg-blue-900/10' : 'border-blue-500 bg-blue-50')
                                            : (isDark ? 'border-transparent bg-[#252525] hover:border-gray-600' : 'border-transparent bg-white hover:border-gray-300')}`}
                                    >
                                        <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${showGridLines ? 'bg-blue-600 border-blue-600' : 'border-gray-400'}`}>
                                            {showGridLines && <Check size={14} className="text-white" />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm">Izgara Çizgileri</div>
                                            <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Hücre sınırlarını belirginleştirerek tabloyu daha net gösterir.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <aside className="xl:sticky xl:top-8">
                        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-[#1f1f1f] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                            <div className={`px-5 py-4 border-b ${isDark ? 'border-gray-800 bg-[#181818]' : 'border-gray-200 bg-gray-50'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                        <Monitor size={18} />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black tracking-wide">Canlı Önizleme</h2>
                                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Yaptığınız değişikliklerin tabloya yansıması</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 space-y-5">
                                <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-gray-700 bg-[#181818]' : 'border-gray-200 bg-gray-50'}`}>
                                    <div className={`grid grid-cols-[110px_minmax(0,1fr)_72px_84px] ${previewFontClass} font-bold ${isDark ? 'bg-[#222] text-gray-300' : 'bg-white text-gray-700'}`}>
                                        {[
                                            { label: 'Kod', align: 'text-left' },
                                            { label: 'Ürün', align: 'text-left' },
                                            { label: 'Birim', align: 'text-center' },
                                            { label: 'Stok', align: 'text-right' }
                                        ].map((col, index) => (
                                            <div
                                                key={col.label}
                                                className={`px-3 flex items-center ${col.align} ${showGridLines && index !== 3 ? (isDark ? 'border-r border-gray-700' : 'border-r border-gray-200') : ''}`}
                                                style={{ height: rowHeight }}
                                            >
                                                {col.label}
                                            </div>
                                        ))}
                                    </div>

                                    {PREVIEW_ROWS.map((row, index) => {
                                        const altRow = zebraStriping && index % 2 === 1;
                                        const rowBg = altRow
                                            ? (isDark ? 'bg-[#202020]' : 'bg-gray-50')
                                            : (isDark ? 'bg-[#181818]' : 'bg-white');

                                        return (
                                            <div
                                                key={row.code}
                                                className={`grid grid-cols-[110px_minmax(0,1fr)_72px_84px] ${previewFontClass} ${rowBg} ${isDark ? 'text-gray-200' : 'text-gray-700'} ${index !== PREVIEW_ROWS.length - 1 ? (isDark ? 'border-t border-gray-800' : 'border-t border-gray-100') : ''}`}
                                            >
                                                {[
                                                    { value: row.code, align: 'text-left font-mono' },
                                                    { value: row.name, align: 'text-left truncate font-medium' },
                                                    { value: row.unit, align: 'text-center' },
                                                    { value: row.stock, align: 'text-right font-semibold' }
                                                ].map((cell, cellIndex) => (
                                                    <div
                                                        key={`${row.code}-${cellIndex}`}
                                                        className={`px-3 flex items-center ${cell.align} ${showGridLines && cellIndex !== 3 ? (isDark ? 'border-r border-gray-800' : 'border-r border-gray-100') : ''}`}
                                                        style={{ height: rowHeight }}
                                                    >
                                                        {cell.value}
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className={`rounded-xl border p-4 ${isDark ? 'border-gray-700 bg-[#181818]' : 'border-gray-200 bg-gray-50'}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className={`${previewFontClass} font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Özet</div>
                                            <p className={`mt-1 ${previewFontClass} ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                Satır yüksekliği <span className="font-semibold">{rowHeight}px</span>, yazı boyutu ise <span className="font-semibold">{fontSize}</span> seviyesinde ayarlandı.
                                            </p>
                                        </div>
                                        <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${isDark ? 'bg-blue-500/10 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                                            {zebraStriping ? 'Zebra Açık' : 'Zebra Kapalı'}
                                        </div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                                        <span className={`px-2 py-1 rounded ${isDark ? 'bg-[#222] text-gray-400' : 'bg-white border border-gray-200 text-gray-600'}`}>
                                            {showGridLines ? 'Izgara çizgileri açık' : 'Izgara çizgileri kapalı'}
                                        </span>
                                        <span className={`px-2 py-1 rounded ${isDark ? 'bg-[#222] text-gray-400' : 'bg-white border border-gray-200 text-gray-600'}`}>
                                            {isDark ? 'Koyu tema' : 'Açık tema'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default SettingsWindow;
