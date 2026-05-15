import React, { useState, useEffect } from 'react';
import {
    Settings, Plus, Trash2, Edit2, X, Box, Layers, Tags,
    Check, Edit3, AlignLeft, ArrowRightLeft, Hash,
    Type as TextIcon, FileText, Search, MoreVertical, AlertCircle, CheckCircle2
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useCodeStore, generatePreviewFromTemplate } from '../store/codeStore';
import FeedbackBanner from './FeedbackBanner';

const CodeTemplateSystem = () => {
    const { theme } = useSettings();
    const isDark = theme === 'dark';

    // --- Sabitler & Veri Yapısı ---
    const availableFields = [
        { key: 'categoryPrefix', label: 'Kategori Öneki', sample: 'HM' },
        { key: 'patternCode', label: 'Ürün Kodu', sample: '7102' },
        { key: 'patternName', label: 'Ürün Adı', sample: 'MEŞE' },
        { key: 'thickness', label: 'Kalınlık', sample: '0,40' },
        { key: 'thicknessCode', label: 'Kalınlık Kodu', sample: '040' },
        { key: 'pvcWidth', label: 'PVC Genişlik', sample: '22' },
        { key: 'pvcWidthCode', label: 'PVC Genişlik Kodu', sample: '22' },
        { key: 'coilWidth', label: 'Bobin Genişlik', sample: '65' },
        { key: 'coilWidthCode', label: 'Bobin Genişlik Kodu', sample: '650' },
        { key: 'surfaceCode', label: 'Yüzey Kodu', sample: 'MT' },
        { key: 'surfaceName', label: 'Yüzey Adı', sample: 'Mat' },
        { key: 'hCode', label: 'H Kodu', sample: 'H05' },
        { key: 'materialType', label: 'Malzeme Türü Adı', sample: 'Mamül PVC 2' },
        { key: 'materialTypeCode', label: 'Malzeme Türü Kodu', sample: 'ML' },
        { key: 'materialTypeGroup', label: 'Malzeme Grup Kodu', sample: '20' },
        { key: 'staticText', label: 'Sabit Metin', sample: 'PVC' }
    ];

    const categories = [
        { id: 'raw', name: 'Hammadde', icon: Box },
        { id: 'semi', name: 'Yarı Mamül', icon: Layers },
        { id: 'final', name: 'Ticari Mal', icon: Tags }
    ];

    // Önizleme için örnek veri
    const mockData = {
        categoryPrefix: 'TM',
        patternCode: '7102',
        patternName: 'MEŞE',
        thickness: '0,40',
        thicknessCode: '040',
        pvcWidth: '22',
        pvcWidthCode: '22',
        coilWidth: '65',
        coilWidthCode: '650',
        surfaceCode: 'MT',
        surfaceName: 'Mat',
        hCode: 'H05',
        materialType: 'Mamül PVC 2',
        materialTypeCode: 'ML',
        materialTypeGroup: '20'
    };

    // --- State Yönetimi ---
    const { templates, categoryMapping, setCategoryMapping, loading, feedback, clearFeedback, initializeStore, addTemplate, updateTemplate, deleteTemplate } = useCodeStore();

    useEffect(() => {
        initializeStore();
    }, [initializeStore]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);

    // --- Fonksiyonlar ---
    const generatePreview = (template, data = mockData) => {
        return generatePreviewFromTemplate(template, data);
    };

    const openEditor = (template = null) => {
        if (template) {
            setEditingTemplate(JSON.parse(JSON.stringify(template)));
        } else {
            setEditingTemplate({
                id: Math.random().toString(36).substr(2, 9),
                name: 'Yeni Şablon',
                type: 'SKU',
                segments: [{ key: 'patternCode', nextSep: '-', customValue: '' }]
            });
        }
        setIsModalOpen(true);
    };

    const saveTemplate = async () => {
        if (templates.find(t => t.id === editingTemplate.id)) {
            await updateTemplate(editingTemplate);
        } else {
            await addTemplate(editingTemplate);
        }
        setIsModalOpen(false);
    };

    const colors = {
        bg: isDark ? 'bg-[#181818]' : 'bg-white',
        text: isDark ? 'text-gray-200' : 'text-slate-700',
        headerBorder: isDark ? 'border-gray-800' : 'border-slate-100',
        title: isDark ? 'text-white' : 'text-slate-900',
        subtitle: isDark ? 'text-gray-500' : 'text-slate-400',
        button: isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-slate-800',
        sectionTitle: isDark ? 'text-gray-500' : 'text-slate-400',
        card: isDark ? 'border-gray-800 bg-[#1f1f1f]' : 'border-slate-200 bg-white shadow-sm',
        tableHeader: isDark ? 'bg-[#1f1f1f] text-gray-500 border-gray-800' : 'bg-slate-50 text-slate-400 border-slate-100',
        tableRow: isDark ? 'hover:bg-[#252525] border-gray-800' : 'hover:bg-slate-50/50 border-slate-50',
        badgeSku: isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-slate-100 border-slate-200 text-slate-600',
        badgeDesc: isDark ? 'bg-transparent border-gray-700 text-gray-500' : 'bg-white border-slate-100 text-slate-400',
        segmentStatic: isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-slate-200 border-slate-300 text-slate-600',
        segmentDynamic: isDark ? 'bg-transparent border-gray-700 text-gray-500' : 'bg-white border-slate-100 text-slate-400',
        input: isDark ? 'bg-[#1a1a1a] border-gray-700 text-white' : 'bg-white border-slate-200 text-slate-700',
        modalOverlay: isDark ? 'bg-black/50' : 'bg-slate-900/10',
        modalBg: isDark ? 'bg-[#1f1f1f] border-gray-800' : 'bg-white border-slate-200',
        modalHeaderBorder: isDark ? 'border-gray-800 bg-[#252525]/50' : 'border-slate-50 bg-slate-50/50',
        previewBox: isDark ? 'bg-black/50 text-white' : 'bg-slate-900 text-white',
        footerBg: isDark ? 'bg-[#1f1f1f] border-gray-800' : 'bg-slate-50 border-slate-100'
    };

    return (
        <div className={`h-full w-full overflow-y-auto custom-scrollbar font-sans antialiased selection:bg-blue-500/30 ${colors.bg} ${colors.text}`}>


            <div className="max-w-5xl mx-auto px-6 py-12">

                {/* Başlık Bölümü */}
                <header className={`mb-12 flex justify-between items-end border-b pb-8 ${colors.headerBorder}`}>
                    <div>
                        <h1 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${colors.title}`}>
                            <Settings className={colors.subtitle} size={22} /> Şablon ve Kural Yönetimi
                        </h1>
                        <p className={`text-sm mt-1 ${colors.subtitle}`}>Stok kodları ve açıklamalar için kurumsal standartlar tanımlayın.</p>
                    </div>
                    <button
                        onClick={() => openEditor()}
                        className={`${colors.button} text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm`}
                    >
                        <Plus size={16} /> Yeni Şablon
                    </button>
                </header>

                <FeedbackBanner
                    feedback={feedback}
                    onClose={clearFeedback}
                    isDarkMode={isDark}
                    className="mb-8 rounded-2xl px-5 py-4"
                />

                <main className="space-y-16">

                    {loading && (
                        <div className="flex justify-center items-center py-12">
                            <span className={`text-sm font-bold animate-pulse ${colors.subtitle}`}>Veriler yükleniyor...</span>
                        </div>
                    )}

                    {/* 1. Şablon Listesi */}
                    {!loading && <section>
                        <div className="flex items-center gap-2 mb-6 px-1">
                            <AlignLeft size={16} className={colors.sectionTitle} />
                            <h2 className={`text-xs font-black uppercase tracking-[0.2em] ${colors.sectionTitle}`}>Şablon Kütüphanesi</h2>
                        </div>

                        <div className={`border rounded-2xl overflow-hidden ${colors.card}`}>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className={`text-[10px] font-black uppercase tracking-widest border-b ${colors.tableHeader}`}>
                                        <th className="py-4 px-6 w-24">Tip</th>
                                        <th className="py-4 px-4">Şablon İsmi</th>
                                        <th className="py-4 px-4">Yapısal Dizilim</th>
                                        <th className="py-4 px-4">Örnek Çıktı</th>
                                        <th className="py-4 px-6 text-right">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y divide-gray-100 ${isDark ? 'divide-gray-800' : 'divide-slate-50'}`}>
                                    {templates.map(t => (
                                        <tr key={t.id} className={`group transition-colors ${colors.tableRow}`}>
                                            <td className="py-4 px-6">
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${t.type === 'SKU' ? colors.badgeSku : colors.badgeDesc}`}>
                                                    {t.type}
                                                </span>
                                            </td>
                                            <td className={`py-4 px-4 text-xs font-bold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{t.name}</td>
                                            <td className="py-4 px-4">
                                                <div className="flex flex-wrap gap-1 items-center">
                                                    {t.segments.map((seg, i) => (
                                                        <React.Fragment key={i}>
                                                            <div className={`px-2 py-0.5 rounded border text-[9px] font-bold flex items-center gap-1.5 ${seg.key === 'staticText' ? colors.segmentStatic : colors.segmentDynamic}`}>
                                                                {seg.key === 'staticText' && <Edit3 size={10} className="opacity-50" />}
                                                                {seg.key === 'staticText' ? `"${seg.customValue}"` : availableFields.find(f => f.key === seg.key)?.label}
                                                            </div>
                                                            {i < t.segments.length - 1 && <span className={`font-bold px-0.5 text-[10px] ${isDark ? 'text-gray-600' : 'text-slate-200'}`}>{seg.nextSep === ' ' ? '␣' : seg.nextSep}</span>}
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className={`py-4 px-4 text-[10px] font-mono group-hover:text-current transition-colors ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                                                {generatePreview(t)}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => openEditor(t)} className={`p-2 transition-colors ${isDark ? 'text-gray-500 hover:text-white' : 'text-slate-400 hover:text-slate-900'}`}><Edit2 size={14} /></button>
                                                    <button onClick={() => deleteTemplate(t.id)} className={`p-2 transition-colors ${isDark ? 'text-gray-600 hover:text-red-400' : 'text-slate-300 hover:text-red-500'}`}><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>}

                    {/* 2. Kategori Eşleştirmeleri */}
                    {!loading && <section>
                        <div className="flex items-center gap-2 mb-6 px-1">
                            <ArrowRightLeft size={16} className={colors.sectionTitle} />
                            <h2 className={`text-xs font-black uppercase tracking-[0.2em] ${colors.sectionTitle}`}>Kategori Bağlantıları</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {categories.map(cat => (
                                <div key={cat.id} className={`border rounded-3xl p-6 transition-all hover:border-opacity-100 ${colors.card} ${isDark ? 'border-gray-800 hover:border-gray-600' : 'border-slate-200 hover:border-slate-300'}`}>
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className={`w-10 h-10 border rounded-xl flex items-center justify-center shadow-sm ${isDark ? 'bg-[#252525] border-gray-700 text-gray-400' : 'bg-white border-slate-100 text-slate-400'}`}>
                                            <cat.icon size={18} />
                                        </div>
                                        <span className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-gray-300' : 'text-slate-800'}`}>{cat.name}</span>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="space-y-1.5">
                                            <label className={`text-[9px] font-black uppercase ml-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Stok Kodu Şablonu</label>
                                            <select
                                                className={`w-full border p-2.5 rounded-xl text-[11px] font-bold outline-none transition-colors cursor-pointer ${colors.input} ${isDark ? 'focus:border-blue-500' : 'hover:border-slate-400'}`}
                                                value={categoryMapping[cat.id].sku}
                                                onChange={e => setCategoryMapping({ ...categoryMapping, [cat.id]: { ...categoryMapping[cat.id], sku: e.target.value } })}
                                            >
                                                {templates.filter(t => t.type === 'SKU').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className={`text-[9px] font-black uppercase ml-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Açıklama Şablonu</label>
                                            <select
                                                className={`w-full border p-2.5 rounded-xl text-[11px] font-bold outline-none transition-colors cursor-pointer ${colors.input} ${isDark ? 'focus:border-blue-500' : 'hover:border-slate-400'}`}
                                                value={categoryMapping[cat.id].desc}
                                                onChange={e => setCategoryMapping({ ...categoryMapping, [cat.id]: { ...categoryMapping[cat.id], desc: e.target.value } })}
                                            >
                                                {templates.filter(t => t.type === 'DESC').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>}
                </main>
            </div>

            {/* --- Minimalist Editör Modal --- */}
            {isModalOpen && editingTemplate && (
                <div className={`fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-300 ${colors.modalOverlay}`}>
                    <div className={`w-full max-w-xl rounded-[2.5rem] shadow-2xl border overflow-hidden animate-in zoom-in-95 duration-200 ${colors.modalBg}`}>
                        <header className={`px-8 py-6 border-b flex justify-between items-center ${colors.modalHeaderBorder}`}>
                            <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                <Settings size={18} className={isDark ? 'text-gray-500' : 'text-slate-400'} /> Şablon Editörü
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-white text-slate-400'}`}><X size={20} /></button>
                        </header>

                        <div className="p-8 space-y-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`text-[9px] font-black uppercase tracking-widest ml-1 mb-1.5 block ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Şablon İsmi</label>
                                    <input
                                        className={`w-full border p-3 rounded-xl outline-none font-bold text-xs transition-all ${colors.input} ${isDark ? 'focus:border-blue-500' : 'focus:border-slate-900'}`}
                                        value={editingTemplate.name}
                                        onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={`text-[9px] font-black uppercase tracking-widest ml-1 mb-1.5 block ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Çıktı Tipi</label>
                                    <select
                                        className={`w-full border p-3 rounded-xl font-bold text-xs outline-none ${colors.input}`}
                                        value={editingTemplate.type}
                                        onChange={e => setEditingTemplate({ ...editingTemplate, type: e.target.value })}
                                    >
                                        <option value="SKU">Stok Kodu (SKU)</option>
                                        <option value="DESC">Açıklama (DESC)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className={`text-[9px] font-black uppercase tracking-widest ml-1 block ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Dizilim Parçaları</label>
                                {editingTemplate.segments.map((seg, idx) => (
                                    <div key={idx} className={`flex items-center gap-2 p-3 rounded-2xl border group transition-all ${isDark ? 'bg-[#252525] border-gray-700 hover:bg-[#2a2a2a]' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-slate-200'}`}>
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-slate-200 text-slate-500'}`}>{idx + 1}</div>

                                        <select
                                            className={`flex-1 border p-2 rounded-lg font-bold text-[11px] outline-none ${colors.input}`}
                                            value={seg.key}
                                            onChange={e => {
                                                const newSegs = [...editingTemplate.segments];
                                                newSegs[idx].key = e.target.value;
                                                setEditingTemplate({ ...editingTemplate, segments: newSegs });
                                            }}
                                        >
                                            {availableFields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                                        </select>

                                        {seg.key === 'staticText' && (
                                            <div className="flex-[1.5] relative">
                                                <Edit3 size={10} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-slate-300'}`} />
                                                <input
                                                    className={`w-full border p-2 pl-8 rounded-lg font-bold text-[11px] outline-none ${colors.input}`}
                                                    placeholder="Metin yazın..."
                                                    value={seg.customValue}
                                                    onChange={e => {
                                                        const newSegs = [...editingTemplate.segments];
                                                        newSegs[idx].customValue = e.target.value;
                                                        setEditingTemplate({ ...editingTemplate, segments: newSegs });
                                                    }}
                                                />
                                            </div>
                                        )}

                                        <div className={`flex items-center gap-1 border px-2 rounded-lg ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-slate-200'}`}>
                                            <span className={`text-[8px] font-bold uppercase ${isDark ? 'text-gray-600' : 'text-slate-300'}`}>Ay.</span>
                                            <input
                                                className={`w-8 text-center py-2 font-black text-[11px] outline-none bg-transparent ${isDark ? 'text-gray-200 placeholder-gray-600' : 'text-slate-700 placeholder-slate-300'}`}
                                                placeholder="-"
                                                value={seg.nextSep}
                                                onChange={e => {
                                                    const newSegs = [...editingTemplate.segments];
                                                    newSegs[idx].nextSep = e.target.value;
                                                    setEditingTemplate({ ...editingTemplate, segments: newSegs });
                                                }}
                                            />
                                        </div>

                                        <button onClick={() => setEditingTemplate({ ...editingTemplate, segments: editingTemplate.segments.filter((_, i) => i !== idx) })} className={`p-2 transition-colors ${isDark ? 'text-gray-600 hover:text-red-400' : 'text-slate-300 hover:text-red-500'}`}><Trash2 size={16} /></button>
                                    </div>
                                ))}

                                <button
                                    onClick={() => setEditingTemplate({ ...editingTemplate, segments: [...editingTemplate.segments, { key: 'patternCode', nextSep: '-', customValue: '' }] })}
                                    className={`w-full py-3 border-2 border-dashed rounded-2xl font-bold transition-all text-[10px] uppercase tracking-widest ${isDark ? 'border-gray-700 text-gray-500 hover:bg-[#252525]' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                                >
                                    + Yeni Parça Ekle
                                </button>
                            </div>

                            <div className={`p-6 rounded-[2rem] ${colors.previewBox}`}>
                                <span className="text-[9px] font-black uppercase mb-1 block tracking-widest opacity-60">Canlı Görünüm Önizleme</span>
                                <div className="font-mono text-base font-bold uppercase tracking-[0.1em]">{generatePreview(editingTemplate)}</div>
                            </div>
                        </div>

                        <footer className={`p-8 border-t flex gap-4 ${colors.footerBg}`}>
                            <button onClick={() => setIsModalOpen(false)} className={`flex-1 py-3.5 border rounded-2xl font-bold uppercase text-[10px] tracking-widest transition-colors ${isDark ? 'bg-[#252525] border-gray-700 text-gray-400 hover:bg-[#2a2a2a]' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-100'}`}>Vazgeç</button>
                            <button onClick={saveTemplate} className={`flex-1 py-3.5 rounded-2xl font-bold shadow-md uppercase text-[10px] tracking-widest transition-all ${colors.button} text-white`}>Kaydet</button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CodeTemplateSystem;
