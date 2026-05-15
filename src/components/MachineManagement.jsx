import React, { useState, useEffect } from 'react';
import { fetchMachines, addMachine, updateMachine, deleteMachine, swapMachineOrder } from '../services/machineService';
import { fetchMaterialTypes } from '../services/materialService';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import FeedbackBanner from './FeedbackBanner';
import ConfirmDialog from './ConfirmDialog';
import {
    Plus, Trash2, Settings2, Save, X,
    CheckCircle2, AlertCircle, ChevronUp, ChevronDown,
    Layers, Palette, Scissors, Power, Package
} from 'lucide-react';

// --- BÖLÜM TANIMLARI ---
const SECTIONS = [
    {
        type: 'extruder',
        label: 'Ekstruder',
        description: 'Ekstrüzyon hatları',
        icon: Layers,
        accent: '#f59e0b',
        accentBg: 'rgba(245,158,11,0.08)',
        accentBorder: 'rgba(245,158,11,0.20)',
        tagBg: 'rgba(245,158,11,0.12)',
        tagText: '#f59e0b',
    },
    {
        type: 'pattern',
        label: 'Desen',
        description: 'Desen baskı hatları',
        icon: Palette,
        accent: '#a855f7',
        accentBg: 'rgba(168,85,247,0.08)',
        accentBorder: 'rgba(168,85,247,0.20)',
        tagBg: 'rgba(168,85,247,0.12)',
        tagText: '#a855f7',
    },
    {
        type: 'cutting',
        label: 'Kesim',
        description: 'Kesim üniteleri',
        icon: Scissors,
        accent: '#10b981',
        accentBg: 'rgba(16,185,129,0.08)',
        accentBorder: 'rgba(16,185,129,0.20)',
        tagBg: 'rgba(16,185,129,0.12)',
        tagText: '#10b981',
    },
];

// --- MAKINE KARTI ---
const MachineCard = ({ machine, section, index, groupMachines, onEdit, onDelete, onMove, isDark, canManage, canDelete }) => {
    const isFirst = index === 0;
    const isLast = index === groupMachines.length - 1;

    return (
        <div className={`group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 border ${
            isDark
                ? 'bg-[#1c1c1c] border-white/[0.06] hover:border-white/[0.12] hover:shadow-xl'
                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg'
        }`}>
            {/* Accent top bar */}
            <div className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: `linear-gradient(to right, ${section.accent}, transparent)` }} />

            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"
                                style={{ boxShadow: '0 0 8px rgba(16,185,129,0.6)' }} />
                            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-30" />
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Çalışıyor
                        </span>
                    </div>
                    {/* Sort + Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canManage && (
                            <div className="flex flex-col gap-0.5">
                                <button onClick={() => onMove(index, 'up', section.type)} disabled={isFirst}
                                    className={`p-1 rounded-md transition-all disabled:opacity-0 ${isDark ? 'hover:bg-white/10 text-gray-600 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-800'}`}>
                                    <ChevronUp size={13} />
                                </button>
                                <button onClick={() => onMove(index, 'down', section.type)} disabled={isLast}
                                    className={`p-1 rounded-md transition-all disabled:opacity-0 ${isDark ? 'hover:bg-white/10 text-gray-600 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-800'}`}>
                                    <ChevronDown size={13} />
                                </button>
                            </div>
                        )}
                        {canManage && <div className={`w-px h-8 mx-1 ${isDark ? 'bg-white/5' : 'bg-gray-200'}`} />}
                        {canManage && (
                            <button onClick={() => onEdit(machine)}
                                className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/10 text-gray-500 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-800'}`}>
                                <Settings2 size={15} />
                            </button>
                        )}
                        {canDelete && (
                            <button onClick={() => onDelete(machine.id)}
                                className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-red-500/10 text-gray-500 hover:text-red-500' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}>
                                <Trash2 size={15} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Machine Icon + Name */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: section.accentBg, border: `1px solid ${section.accentBorder}` }}>
                        <Power size={20} style={{ color: section.accent }} />
                    </div>
                    <div>
                        <h3 className={`font-bold text-[15px] leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {machine.name}
                        </h3>
                        {machine.location && (
                            <p className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {machine.location}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className={`flex items-center justify-between pt-3 border-t ${isDark ? 'border-white/[0.05]' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        <span className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Aktif</span>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                        style={{ background: section.tagBg, color: section.tagText }}>
                        Sıra #{index + 1}
                    </span>
                </div>
            </div>
        </div>
    );
};

// --- DÜZENLEME MODALI ---
const EditModal = ({ machine, onSave, onClose, isDark, materialTypeOptions }) => {
    const [form, setForm] = useState({ 
        name: machine.name, 
        type: machine.type, 
        location: machine.location || '',
        product_groups: machine.product_groups || []
    });

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className={`rounded-2xl border p-7 w-[480px] shadow-2xl ${isDark ? 'bg-[#1c1c1c] border-white/10' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Makineyi Düzenle</h3>
                    <button onClick={onClose}
                        className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                        <X size={18} />
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className={`text-[11px] font-bold uppercase tracking-wider block mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Makine Adı</label>
                        <input
                            autoFocus
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all ${isDark ? 'bg-[#121212] border-white/10 text-white focus:border-blue-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-400 focus:bg-white'}`}
                            placeholder="Örn: Ekstruder E-100"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={`text-[11px] font-bold uppercase tracking-wider block mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Bölüm</label>
                            <select
                                value={form.type}
                                onChange={e => setForm({ ...form, type: e.target.value })}
                                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all appearance-none ${isDark ? 'bg-[#121212] border-white/10 text-white focus:border-blue-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-400 focus:bg-white'}`}
                            >
                                <option value="extruder">Ekstruder</option>
                                <option value="pattern">Desen</option>
                                <option value="cutting">Kesim</option>
                            </select>
                        </div>
                        <div>
                            <label className={`text-[11px] font-bold uppercase tracking-wider block mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Konum</label>
                            <input
                                value={form.location}
                                onChange={e => setForm({ ...form, location: e.target.value })}
                                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all ${isDark ? 'bg-[#121212] border-white/10 text-white focus:border-blue-500/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-400 focus:bg-white'}`}
                                placeholder="Örn: A-Sektörü"
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className={`text-[11px] font-bold uppercase tracking-wider block mb-2 flex items-center gap-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <Package size={14} /> Üretilen Ürün Grupları (Opsiyonel)
                        </label>
                        <div className={`p-3 rounded-xl border flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar ${isDark ? 'bg-[#121212] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                            {materialTypeOptions.map(opt => (
                                <label key={opt.value} className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <input
                                        type="checkbox"
                                        className="rounded text-blue-600"
                                        checked={form.product_groups.includes(opt.value)}
                                        onChange={e => {
                                            const current = form.product_groups || [];
                                            const updated = e.target.checked
                                                ? [...current, opt.value]
                                                : current.filter(v => v !== opt.value);
                                            setForm({ ...form, product_groups: updated });
                                        }}
                                    />
                                    <span>{opt.label}</span>
                                    {opt.group && (
                                        <span className={`text-[10px] font-mono px-1 rounded ${isDark ? 'bg-[#333] text-gray-400' : 'bg-gray-200 text-gray-500'}`}>{opt.group}</span>
                                    )}
                                </label>
                            ))}
                            {materialTypeOptions.length === 0 && (
                                <span className={`text-xs italic ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Ürün grubu bulunamadı.</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                    <button onClick={onClose}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                        İptal
                    </button>
                    <button onClick={() => onSave(form)}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all active:scale-95">
                        <Save size={15} className="inline mr-2" />Kaydet
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- ANA BİLEŞEN ---
const MachineManagement = () => {
    const { theme } = useSettings();
    const { can } = useAuth();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Yetki Kontrolleri
    const canManage = true; // can('machine.manage'); // Geçici olarak yetki kontrolü kaldırıldı
    const canDelete = true; // can('machine.delete'); // Geçici olarak yetki kontrolü kaldırıldı

    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingMachine, setEditingMachine] = useState(null);
    const [addingType, setAddingType] = useState(null);
    const [addForm, setAddForm] = useState({ name: '', location: '', product_groups: [] });
    const [feedback, setFeedback] = useState(null);
    const [confirmState, setConfirmState] = useState({ isOpen: false, machineId: null });
    const [materialTypeOptions, setMaterialTypeOptions] = useState([]);

    useEffect(() => { 
        loadMachines(); 
        loadMaterialTypes();
    }, []);

    const loadMaterialTypes = async () => {
        try {
            const data = await fetchMaterialTypes();
            if (data) {
                setMaterialTypeOptions(data.map(t => ({
                    value: t.material_group || t.name,
                    label: t.name,
                    code: t.code,
                    group: t.material_group,
                })));
            }
        } catch (err) {
            console.error("Error fetching material types:", err);
        }
    };

    const loadMachines = async () => {
        try {
            setLoading(true);
            const loadedMachines = await fetchMachines();
            setMachines(loadedMachines);
        } catch (err) {
            setFeedback({ type: 'error', message: 'Makineler yüklenemedi: ' + err.message });
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!addForm.name.trim()) return;
        const groupMachines = machines.filter(m => m.type === addingType);
        try {
            setFeedback(null);
            await addMachine(addForm, addingType, groupMachines.length);
            setAddingType(null);
            setAddForm({ name: '', location: '', product_groups: [] });
            setFeedback({ type: 'success', message: 'Makine eklendi.' });
            loadMachines();
        } catch (err) { setFeedback({ type: 'error', message: 'Kayıt hatası: ' + err.message }); }
    };

    const handleSave = async (form) => {
        try {
            setFeedback(null);
            await updateMachine(editingMachine.id, form);
            setEditingMachine(null);
            setFeedback({ type: 'success', message: 'Makine güncellendi.' });
            loadMachines();
        } catch (err) { setFeedback({ type: 'error', message: 'Güncelleme hatası: ' + err.message }); }
    };

    const handleDelete = (id) => {
        setConfirmState({ isOpen: true, machineId: id });
    };

    const executeDelete = async () => {
        const id = confirmState.machineId;
        setConfirmState({ isOpen: false, machineId: null });
        if (!id) return;
        
        try {
            setFeedback(null);
            await deleteMachine(id);
            setFeedback({ type: 'success', message: 'Makine silindi.' });
            loadMachines();
        } catch (err) { setFeedback({ type: 'error', message: 'Silme hatası: ' + err.message }); }
    };

    const handleMove = async (index, direction, type) => {
        const groupMachines = machines.filter(m => m.type === type);
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= groupMachines.length) return;
        const cur = groupMachines[index];
        const neighbor = groupMachines[newIndex];

        // Optimistik UI güncellemesi — kullanıcı anında sonuç görür
        setMachines(prev => {
            const updated = [...prev];
            const curIdx = updated.findIndex(m => m.id === cur.id);
            const neighborIdx = updated.findIndex(m => m.id === neighbor.id);
            if (curIdx === -1 || neighborIdx === -1) return prev;
            const tempOrder = updated[curIdx].display_order;
            updated[curIdx] = { ...updated[curIdx], display_order: updated[neighborIdx].display_order };
            updated[neighborIdx] = { ...updated[neighborIdx], display_order: tempOrder };
            return updated;
        });

        try {
            await swapMachineOrder(cur, neighbor);
            loadMachines();
        } catch (err) {
            console.error('Sıralama hatası:', err);
            loadMachines(); // optimistik güncellemeyi geri al
            setFeedback({ type: 'error', message: 'Sıralama güncellenemedi: ' + err.message });
        }
    };

    if (loading) return (
        <div className={`h-full flex items-center justify-center ${isDark ? 'bg-[#181818]' : 'bg-gray-50'}`}>
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
                <p className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Makineler yükleniyor...</p>
            </div>
        </div>
    );

    return (
        <div className={`h-full w-full overflow-y-auto custom-scrollbar select-text transition-colors ${isDark ? 'bg-[#181818] text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="max-w-[1400px] mx-auto px-8 py-8">
                <FeedbackBanner
                    feedback={feedback}
                    onClose={() => setFeedback(null)}
                    isDarkMode={isDark}
                    className="mb-6 rounded-xl px-4 py-3 text-sm"
                />

                {/* BAŞLIK */}
                <header className="mb-10">
                    <h1 className="text-3xl font-black tracking-tight mb-1.5">Makine Yönetimi</h1>
                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Üretim hatlarınızı organize edin. Her bölüm için ayrı makine listeleri oluşturun.
                    </p>
                </header>

                {/* ÖZET KARTLAR */}
                <div className="grid grid-cols-3 gap-4 mb-10">
                    {SECTIONS.map(section => {
                        const count = machines.filter(m => m.type === section.type).length;
                        const Icon = section.icon;
                        return (
                            <div key={section.type} className={`relative rounded-2xl p-5 overflow-hidden border transition-colors ${isDark ? 'bg-[#1c1c1c] border-white/[0.06]' : 'bg-white border-gray-200'}`}
                                style={{ borderLeft: `3px solid ${section.accent}` }}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ background: section.accentBg, border: `1px solid ${section.accentBorder}` }}>
                                        <Icon size={20} style={{ color: section.accent }} />
                                    </div>
                                    <span className="text-4xl font-black" style={{ color: section.accent }}>{count}</span>
                                </div>
                                <div className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{section.label}</div>
                                <div className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{section.description}</div>
                            </div>
                        );
                    })}
                </div>

                {/* 3 SÜTUNLU GRUPLAR */}
                <div className="grid grid-cols-3 gap-6">
                    {SECTIONS.map(section => {
                        const groupMachines = machines.filter(m => m.type === section.type);
                        const Icon = section.icon;

                        return (
                            <div key={section.type} className="flex flex-col gap-4">
                                {/* Grup Başlığı */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                            style={{ background: section.accentBg, border: `1px solid ${section.accentBorder}` }}>
                                            <Icon size={15} style={{ color: section.accent }} />
                                        </div>
                                        <div>
                                            <h2 className={`font-black text-sm leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>{section.label}</h2>
                                            <p className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{groupMachines.length} makine</p>
                                        </div>
                                    </div>
                                    {canManage && (
                                        <button
                                            onClick={() => { setAddingType(section.type); setAddForm({ name: '', location: '', product_groups: [] }); }}
                                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all border ${isDark ? 'text-gray-600 hover:text-white border-transparent hover:border-white/10 hover:bg-white/5' : 'text-gray-400 hover:text-gray-800 border-transparent hover:border-gray-200 hover:bg-gray-100'}`}
                                            title={`${section.label} makine ekle`}>
                                            <Plus size={16} />
                                        </button>
                                    )}
                                </div>

                                {/* Boş durum */}
                                {groupMachines.length === 0 && addingType !== section.type && canManage && (
                                    <button
                                        onClick={() => { setAddingType(section.type); setAddForm({ name: '', location: '', product_groups: [] }); }}
                                        className={`flex flex-col items-center justify-center gap-3 py-10 rounded-2xl border border-dashed transition-all cursor-pointer group ${isDark ? 'border-white/[0.07] hover:border-white/20 text-gray-600 hover:text-gray-400' : 'border-gray-200 hover:border-gray-300 text-gray-300 hover:text-gray-400'}`}>
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border border-dashed transition-all ${isDark ? 'border-white/10 group-hover:border-white/20' : 'border-gray-200 group-hover:border-gray-300'}`}>
                                            <Plus size={18} />
                                        </div>
                                        <span className="text-xs font-bold">Makine Ekle</span>
                                    </button>
                                )}

                                {/* Ekleme Formu */}
                                {addingType === section.type && (
                                    <div className={`rounded-2xl border p-4 shadow-lg ${isDark ? 'bg-[#1c1c1c]' : 'bg-white'}`}
                                        style={{ borderColor: section.accentBorder }}>
                                        <p className="text-[11px] font-bold uppercase tracking-wider mb-3"
                                            style={{ color: section.accent }}>
                                            Yeni {section.label} Makine
                                        </p>
                                        <div className="space-y-2.5">
                                            <input
                                                autoFocus
                                                value={addForm.name}
                                                onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                                                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all ${isDark ? 'bg-[#111] border-white/10 text-white focus:border-blue-500/50 placeholder:text-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-400 placeholder:text-gray-300'}`}
                                                placeholder="Makine adı..."
                                            />
                                            <input
                                                value={addForm.location}
                                                onChange={e => setAddForm({ ...addForm, location: e.target.value })}
                                                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all ${isDark ? 'bg-[#111] border-white/10 text-white focus:border-blue-500/50 placeholder:text-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-400 placeholder:text-gray-300'}`}
                                                placeholder="Konum (opsiyonel)..."
                                            />
                                            {/* Ürün Grubu Seçimi */}
                                            <div className="mt-2">
                                                <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    <Package size={12} /> Ürün Grupları
                                                </label>
                                                <div className={`p-2.5 rounded-xl border flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar ${isDark ? 'bg-[#111] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                                                    {materialTypeOptions.map(opt => (
                                                        <label key={opt.value} className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                            <input
                                                                type="checkbox"
                                                                className="rounded text-blue-600"
                                                                checked={(addForm.product_groups || []).includes(opt.value)}
                                                                onChange={e => {
                                                                    const current = addForm.product_groups || [];
                                                                    const updated = e.target.checked
                                                                        ? [...current, opt.value]
                                                                        : current.filter(v => v !== opt.value);
                                                                    setAddForm({ ...addForm, product_groups: updated });
                                                                }}
                                                            />
                                                            <span>{opt.label}</span>
                                                        </label>
                                                    ))}
                                                    {materialTypeOptions.length === 0 && (
                                                        <span className={`text-[10px] italic ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Bulunamadı.</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <button onClick={() => setAddingType(null)}
                                                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${isDark ? 'text-gray-500 hover:text-white bg-white/5 hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200'}`}>
                                                İptal
                                            </button>
                                            <button onClick={handleAdd}
                                                className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
                                                style={{ background: section.accent }}>
                                                Kaydet
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {groupMachines.map((machine, idx) => (
                                    <MachineCard
                                        key={machine.id}
                                        machine={machine}
                                        section={section}
                                        index={idx}
                                        groupMachines={groupMachines}
                                        onEdit={setEditingMachine}
                                        onDelete={handleDelete}
                                        onMove={handleMove}
                                        isDark={isDark}
                                        canManage={canManage}
                                        canDelete={canDelete}
                                    />
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>

            {editingMachine && (
                <EditModal
                    machine={editingMachine}
                    onSave={handleSave}
                    onClose={() => setEditingMachine(null)}
                    isDark={isDark}
                    materialTypeOptions={materialTypeOptions}
                />
            )}
            
            <ConfirmDialog
                isOpen={confirmState.isOpen}
                onConfirm={executeDelete}
                onCancel={() => setConfirmState({ isOpen: false, machineId: null })}
                title="Makineyi Sil"
                message="Bu makineyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
            />
        </div>
    );
};

export default MachineManagement;
